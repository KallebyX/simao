import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuthStore from '@/stores/authStore';
import useNotificationStore from '@/stores/notificationStore';
import { SocketData } from '@/types';

interface UseSocketOptions {
  autoConnect?: boolean;
  enableReconnection?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    autoConnect = true,
    enableReconnection = true,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const { user, token, isAuthenticated } = useAuthStore();
  const { showError, showInfo } = useNotificationStore();
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventListenersRef = useRef<Map<string, Function[]>>(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (autoConnect && isAuthenticated && token && user && !socketRef.current) {
      connectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token, user, autoConnect]);

  const connectSocket = () => {
    if (socketRef.current) {
      return socketRef.current;
    }

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    
    socketRef.current = io(baseURL, {
      auth: {
        token
      },
      query: {
        companyId: user?.companyId
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: enableReconnection,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current?.id);
      setIsConnected(true);
      setConnectionError(null);
      
      // Join company room
      if (user?.companyId) {
        socketRef.current?.emit('joinCompany', user.companyId);
      }

      onConnect?.();
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.();

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socketRef.current?.connect();
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      onError?.(error);

      // Show user-friendly error message
      if (error.message.includes('unauthorized')) {
        showError('Conexão não autorizada. Faça login novamente.');
      } else {
        showError('Erro na conexão em tempo real');
      }
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      showInfo('Conexão em tempo real restaurada');
    });

    socketRef.current.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      showError('Falha ao reconectar. Atualize a página.');
    });

    return socketRef.current;
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      console.log('Disconnecting socket');
      
      // Remove all event listeners
      eventListenersRef.current.clear();
      
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionError(null);
    }
  };

  const reconnectSocket = () => {
    disconnectSocket();
    if (isAuthenticated && token && user) {
      connectSocket();
    }
  };

  // Listen to socket events
  const on = (event: string, callback: (data: any) => void) => {
    if (!socketRef.current) {
      console.warn('Socket not connected. Cannot listen to event:', event);
      return;
    }

    // Store listener reference for cleanup
    const listeners = eventListenersRef.current.get(event) || [];
    listeners.push(callback);
    eventListenersRef.current.set(event, listeners);

    socketRef.current.on(event, callback);
  };

  // Remove socket event listeners
  const off = (event: string, callback?: (data: any) => void) => {
    if (!socketRef.current) return;

    if (callback) {
      socketRef.current.off(event, callback);
      
      // Remove from stored listeners
      const listeners = eventListenersRef.current.get(event) || [];
      const updatedListeners = listeners.filter(l => l !== callback);
      
      if (updatedListeners.length === 0) {
        eventListenersRef.current.delete(event);
      } else {
        eventListenersRef.current.set(event, updatedListeners);
      }
    } else {
      socketRef.current.off(event);
      eventListenersRef.current.delete(event);
    }
  };

  // Emit socket events
  const emit = (event: string, data?: any) => {
    if (!socketRef.current) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return false;
    }

    socketRef.current.emit(event, data);
    return true;
  };

  // Join specific rooms
  const joinRoom = (room: string) => {
    emit('joinRoom', room);
  };

  const leaveRoom = (room: string) => {
    emit('leaveRoom', room);
  };

  // Join ticket room
  const joinTicketRoom = (ticketId: number) => {
    emit('joinChatBox', ticketId);
  };

  const leaveTicketRoom = (ticketId: number) => {
    emit('leaveChatBox', ticketId);
  };

  // Join queue room
  const joinQueueRoom = (queueId: number) => {
    joinRoom(`queue:${queueId}`);
  };

  const leaveQueueRoom = (queueId: number) => {
    leaveRoom(`queue:${queueId}`);
  };

  // Common event handlers
  const onTicketUpdate = (callback: (data: SocketData) => void) => {
    on('ticket', callback);
  };

  const onMessageReceived = (callback: (data: SocketData) => void) => {
    on('appMessage', callback);
  };

  const onContactUpdate = (callback: (data: SocketData) => void) => {
    on('contact', callback);
  };

  const onUserUpdate = (callback: (data: SocketData) => void) => {
    on('user', callback);
  };

  const onWhatsappUpdate = (callback: (data: SocketData) => void) => {
    on('whatsappSession', callback);
  };

  const onQueueUpdate = (callback: (data: SocketData) => void) => {
    on('queue', callback);
  };

  const onNotificationReceived = (callback: (data: any) => void) => {
    on('notification', callback);
  };

  return {
    // Connection state
    socket: socketRef.current,
    isConnected,
    connectionError,
    
    // Connection methods
    connect: connectSocket,
    disconnect: disconnectSocket,
    reconnect: reconnectSocket,
    
    // Event methods
    on,
    off,
    emit,
    
    // Room methods
    joinRoom,
    leaveRoom,
    joinTicketRoom,
    leaveTicketRoom,
    joinQueueRoom,
    leaveQueueRoom,
    
    // Specific event handlers
    onTicketUpdate,
    onMessageReceived,
    onContactUpdate,
    onUserUpdate,
    onWhatsappUpdate,
    onQueueUpdate,
    onNotificationReceived
  };
};