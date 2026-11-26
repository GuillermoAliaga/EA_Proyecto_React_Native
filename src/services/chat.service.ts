import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { User } from '../models/user.model';
import { environment } from '../config/environment';
import { apiClient } from './apiClient';

export interface ChatUser {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  _id?: string;
  room: string;
  user: Pick<User, '_id' | 'name'>;
  text: string;
  timestamp: string;
}

function extractChatUsers(payload: unknown): ChatUser[] {
  let candidates: unknown = payload;
  if (typeof candidates === 'object' && candidates !== null) {
    const response = candidates as Record<string, unknown>;
    if (Array.isArray(response.users)) {
      candidates = response.users;
    } else if (Array.isArray(response.data)) {
      candidates = response.data;
    } else if (
      typeof response.data === 'object' &&
      response.data !== null &&
      Array.isArray((response.data as Record<string, unknown>).users)
    ) {
      candidates = (response.data as { users: unknown[] }).users;
    }
  }

  if (!Array.isArray(candidates)) {
    throw new Error('El servidor devolvió una lista de usuarios no válida.');
  }

  return candidates.map((value, index) => {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`El usuario ${index + 1} recibido del servidor no es válido.`);
    }
    const candidate = value as Partial<ChatUser>;
    if (typeof candidate._id !== 'string' || typeof candidate.name !== 'string') {
      throw new Error(`El usuario ${index + 1} recibido del servidor no tiene un identificador o nombre válido.`);
    }
    return {
      _id: candidate._id,
      name: candidate.name,
      ...(typeof candidate.email === 'string' ? { email: candidate.email } : {}),
      ...(typeof candidate.avatarUrl === 'string' ? { avatarUrl: candidate.avatarUrl } : {}),
    };
  });
}

export async function getChatUsers(signal?: AbortSignal): Promise<ChatUser[]> {
  const response = await apiClient<unknown>('/users/chat-users', { signal });
  if (response === null) throw new Error('El servidor no devolvió los usuarios del chat.');
  return extractChatUsers(response);
}

export function createChatSocket(accessToken: string): Socket {
  return io(environment.apiUrl, {
    autoConnect: false,
    auth: { token: accessToken },
    reconnection: true,
  });
}

export function getDirectRoom(firstUserId: string, secondUserId: string): string {
  const [first, second] =
    firstUserId.toLowerCase() < secondUserId.toLowerCase()
      ? [firstUserId.toLowerCase(), secondUserId.toLowerCase()]
      : [secondUserId.toLowerCase(), firstUserId.toLowerCase()];
  return `direct:${first}:${second}`;
}

export function getActivityRoom(activityId: string): string {
  return `activity:${activityId}`;
}
