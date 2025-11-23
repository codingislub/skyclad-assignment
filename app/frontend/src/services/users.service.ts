import api from '@/lib/axios';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'ADMIN' | 'OPERATOR';
}

export const usersService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await api.post<User>('/users', data);
    return response.data;
  }
};
