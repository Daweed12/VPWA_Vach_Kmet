import type { Socket } from 'socket.io-client';
import type { MessageFromApi } from './useMessages';

export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  firstname: string | null;
  surname: string | null;
  status: string | null;
  profilePicture?: string | null;
}

export function useSocketEvents(
  socket: Socket | null,
  currentUser: { value: CurrentUser | null },
  activeChannelId: { value: number | null },
  rawMessages: { value: MessageFromApi[] },
  callbacks: {
    onUserStatusChanged?: (data: {
      userId: number;
      status: string;
      connection?: string;
      name: string;
    }) => void;
    onUserNicknameChanged?: (data: {
      userId: number;
      nickname?: string | null;
      firstname?: string | null;
      surname?: string | null;
      email?: string | null;
      name: string;
    }) => void;
    onUserAvatarChanged?: (data: { userId: number; profilePicture: string; name: string }) => void;
    onChannelDeleted?: (data: { channelId: number; title: string }) => void;
    onChannelCreated?: (data: {
      id: number;
      title: string;
      availability: string;
      creatorId: number;
      createdAt: string;
      userId?: number;
    }) => void;
    onInviteCreated?: (data: {
      id: number;
      channelId: number;
      title: string;
      availability: string;
      createdAt: string;
      userId: number;
    }) => void;
    onChannelJoined?: (data: {
      channelId: number;
      userId: number;
      channel: {
        id: number;
        title: string;
        availability: string;
        creatorId: number;
        createdAt: string;
      };
    }) => void;
    onMemberJoined?: (data: {
      channelId: number;
      userId: number;
      userName: string;
      status: string;
    }) => void;
    onMessage?: (message: MessageFromApi & { channelId?: number; channel_id?: number }) => void;
    onNewMessageNotification?: (
      message: MessageFromApi & { channelId?: number; channel_id?: number },
    ) => void;
  },
) {
  if (!socket) return;

  // Listen for user status changes
  socket.on('user:status:changed', (data: { userId: number; status: string; name: string }) => {
    console.log('📢 Received user:status:changed event:', data);

    window.dispatchEvent(
      new CustomEvent('userStatusChanged', {
        detail: {
          userId: data.userId,
          status: data.status,
          name: data.name,
        },
      }),
    );

    callbacks.onUserStatusChanged?.(data);
  });

  // Listen for user avatar changes
  socket.on(
    'user:avatar:changed',
    (data: { userId: number; profilePicture: string; name: string }) => {
      console.log('📢 Received user:avatar:changed event:', data);

      // Aktualizuj avatary v správach - pridaj timestamp pre cache busting
      const timestamp = Date.now();
      rawMessages.value.forEach((msg) => {
        if (msg.sender && msg.sender.id === data.userId) {
          msg.sender.profilePicture = `${data.profilePicture}?t=${timestamp}`;
        }
      });

      // Aktualizuj currentUser avatar, ak je to aktuálny používateľ
      if (currentUser.value && currentUser.value.id === data.userId) {
        currentUser.value.profilePicture = data.profilePicture;
        localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
      }

      // Dispatch window event pre ostatné komponenty
      window.dispatchEvent(
        new CustomEvent('userAvatarChanged', {
          detail: {
            userId: data.userId,
            profilePicture: data.profilePicture,
            name: data.name,
          },
        }),
      );

      callbacks.onUserAvatarChanged?.(data);
    },
  );

  // Listen for channel deletion
  socket.on('channel:deleted', (data: { channelId: number; title: string }) => {
    console.log('📢 Received channel:deleted event:', data);

    if (activeChannelId.value === data.channelId) {
      activeChannelId.value = null;
      rawMessages.value = [];
      window.dispatchEvent(
        new CustomEvent('channelSelected', {
          detail: { id: null, title: null },
        }),
      );
    }

    window.dispatchEvent(
      new CustomEvent('channelDeleted', {
        detail: {
          channelId: data.channelId,
          title: data.title,
        },
      }),
    );

    callbacks.onChannelDeleted?.(data);
  });

  // Listen for channel creation
  socket.on(
    'channel:created',
    (data: {
      id: number;
      title: string;
      availability: string;
      creatorId: number;
      createdAt: string;
      userId?: number;
    }) => {
      console.log('📢 Received channel:created event:', data);

      window.dispatchEvent(
        new CustomEvent('channelCreated', {
          detail: {
            id: data.id,
            title: data.title,
            availability: data.availability,
            creatorId: data.creatorId,
            createdAt: data.createdAt,
            userId: data.userId,
          },
        }),
      );

      callbacks.onChannelCreated?.(data);
    },
  );

  // Listen for invite creation
  socket.on(
    'invite:created',
    (data: {
      id: number;
      channelId: number;
      title: string;
      availability: string;
      createdAt: string;
      userId: number;
    }) => {
      console.log('📢 Received invite:created event:', data);

      window.dispatchEvent(
        new CustomEvent('inviteCreated', {
          detail: {
            id: data.id,
            channelId: data.channelId,
            title: data.title,
            availability: data.availability,
            createdAt: data.createdAt,
            userId: data.userId,
          },
        }),
      );

      callbacks.onInviteCreated?.(data);
    },
  );

  // Listen for channel join
  socket.on(
    'channel:joined',
    (data: {
      channelId: number;
      userId: number;
      channel: {
        id: number;
        title: string;
        availability: string;
        creatorId: number;
        createdAt: string;
      };
    }) => {
      console.log('📢 Received channel:joined event:', data);

      window.dispatchEvent(
        new CustomEvent('channelJoined', {
          detail: {
            channelId: data.channelId,
            userId: data.userId,
            channel: data.channel,
          },
        }),
      );

      callbacks.onChannelJoined?.(data);
    },
  );

  // Listen for member joined
  socket.on(
    'member:joined',
    (data: { channelId: number; userId: number; userName: string; status: string }) => {
      console.log('📢 Received member:joined event:', data);

      window.dispatchEvent(
        new CustomEvent('memberJoined', {
          detail: {
            channelId: data.channelId,
            userId: data.userId,
            userName: data.userName,
            status: data.status,
          },
        }),
      );

      callbacks.onMemberJoined?.(data);
    },
  );

  // Listen for chat messages
  socket.on('chat:message', (data: unknown) => {
    console.log('🔵🔵🔵 RECEIVED chat:message event:', data);

    const message = data as MessageFromApi & { channelId?: number; channel_id?: number };

    // Validate message structure
    if (!message.sender) {
      console.warn('⚠️ Received message without sender:', message);
      return;
    }

    if (!message.content) {
      console.warn('⚠️ Received message without content:', message);
      return;
    }

    // Get channel ID from message
    const messageChannelId = message.channelId || message.channel_id;

    if (!messageChannelId) {
      console.warn('⚠️ Received message without channelId:', message);
      return;
    }

    // Volať callback pre notifikáciu pre VŠETKY správy (aj z iných kanálov)
    // Toto sa volá pred kontrolou aktívneho kanála, aby sa notifikácie zobrazovali aj pre iné kanály
    callbacks.onNewMessageNotification?.(message);

    // If we have an active channel, only show messages for that channel
    if (activeChannelId.value !== null && messageChannelId !== activeChannelId.value) {
      console.log(
        `ℹ️ Ignoring message - active channel (${activeChannelId.value}) != message channel (${messageChannelId})`,
      );
      return;
    }

    console.log('✅ Message passed channel filter, processing...');

    // Check if this is from current user - might be replacing optimistic message
    const isFromCurrentUser = currentUser.value && message.sender.id === currentUser.value.id;
    if (isFromCurrentUser) {
      // Try to find and replace optimistic message (negative ID)
      const optimisticIndex = rawMessages.value.findIndex(
        (m) => m.id < 0 && m.content === message.content,
      );
      if (optimisticIndex !== -1) {
        console.log('✅ Replacing optimistic message with real one');
        rawMessages.value[optimisticIndex] = message;
        callbacks.onMessage?.(message);
        return;
      }
    }

    // Check if message already exists (avoid duplicates)
    const exists = rawMessages.value.some((m) => m.id === message.id && m.id > 0);
    if (exists) {
      console.log('ℹ️ Message already exists, skipping (duplicate)');
      return;
    }

    console.log('✅ Adding new message to chat');
    rawMessages.value.push(message);

    callbacks.onMessage?.(message);
  });
}
