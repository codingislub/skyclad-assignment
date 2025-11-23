import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface UploadQueueDB extends DBSchema {
  uploads: {
    key: string;
    value: {
      id: string;
      file: File;
      data: any;
      status: 'pending' | 'uploading' | 'completed' | 'failed';
      createdAt: number;
      retryCount: number;
      error?: string;
    };
    indexes: { 'by-status': string };
  };
}

class OfflineQueueService {
  private db: IDBPDatabase<UploadQueueDB> | null = null;

  async init() {
    if (this.db) return;

    this.db = await openDB<UploadQueueDB>('upload-queue', 1, {
      upgrade(db) {
        const store = db.createObjectStore('uploads', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
      },
    });

    // Listen for online/offline events
    window.addEventListener('online', () => this.processQueue());
    window.addEventListener('offline', () => console.log('Offline mode activated'));

    // Process queue on init if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async addUpload(file: File, data: any): Promise<string> {
    if (!this.db) await this.init();

    const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db!.add('uploads', {
      id,
      file,
      data,
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 0,
    });

    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  async processQueue() {
    if (!this.db) await this.init();

    const pending = await this.db!.getAllFromIndex('uploads', 'by-status', 'pending');

    for (const upload of pending) {
      try {
        await this.uploadFile(upload);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }

  private async uploadFile(upload: UploadQueueDB['uploads']['value']) {
    if (!this.db) return;

    // Update status to uploading
    await this.db.put('uploads', { ...upload, status: 'uploading' });

    try {
      // Perform actual upload
      const formData = new FormData();
      formData.append('file', upload.file);
      Object.keys(upload.data).forEach((key) => {
        formData.append(key, upload.data[key]);
      });

      const response = await fetch('/api/imports', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Upload failed');

      // Mark as completed
      await this.db.put('uploads', { ...upload, status: 'completed' });

      // Remove completed uploads after 24 hours
      setTimeout(() => this.removeUpload(upload.id), 24 * 60 * 60 * 1000);
    } catch (error) {
      const retryCount = upload.retryCount + 1;
      
      if (retryCount >= 3) {
        // Mark as failed after 3 retries
        await this.db.put('uploads', {
          ...upload,
          status: 'failed',
          retryCount,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      } else {
        // Retry with exponential backoff
        await this.db.put('uploads', {
          ...upload,
          status: 'pending',
          retryCount,
        });
        setTimeout(() => this.processQueue(), Math.pow(2, retryCount) * 1000);
      }
    }
  }

  async getQueueStatus() {
    if (!this.db) await this.init();

    const all = await this.db!.getAll('uploads');
    
    return {
      total: all.length,
      pending: all.filter((u) => u.status === 'pending').length,
      uploading: all.filter((u) => u.status === 'uploading').length,
      completed: all.filter((u) => u.status === 'completed').length,
      failed: all.filter((u) => u.status === 'failed').length,
    };
  }

  async removeUpload(id: string) {
    if (!this.db) await this.init();
    await this.db!.delete('uploads', id);
  }

  async clearCompleted() {
    if (!this.db) await this.init();

    const completed = await this.db!.getAllFromIndex('uploads', 'by-status', 'completed');
    
    for (const upload of completed) {
      await this.removeUpload(upload.id);
    }
  }
}

export const offlineQueueService = new OfflineQueueService();
