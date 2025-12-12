import { ref } from 'vue';
import { useQuasar, Notify } from 'quasar';
import type { MessageFromApi } from './useMessages';
import { api } from 'boot/api';

const defaultUserAvatar = new URL('../assets/default_user_avatar.png', import.meta.url).href;

const getFullAvatarUrl = (path: string | null | undefined): string => {
  if (!path) return defaultUserAvatar;
  if (path.startsWith('http')) return path;

  const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
};

export function useNotifications() {
  const $q = useQuasar();
  const notificationPermission = ref<NotificationPermission>(
    typeof window !== 'undefined' && typeof Notification !== 'undefined'
      ? Notification.permission
      : 'default',
  );

  const isNotificationSupported =
    typeof window !== 'undefined' && typeof Notification !== 'undefined';

  const requestPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported) {
      return false;
    }

    if (notificationPermission.value === 'granted') {
      return true;
    }

    if (notificationPermission.value === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      notificationPermission.value = permission;
      return permission === 'granted';
    } catch (error) {
      return false;
    }
  };

  const isUserMentioned = (messageContent: string, userNickname: string | null): boolean => {
    if (!userNickname) return false;
    const mentionRegex = new RegExp(`\\B@${userNickname}\\b`, 'gi');
    return mentionRegex.test(messageContent);
  };

  const showMessageNotification = (
    message: MessageFromApi,
    channelTitle?: string | null,
    currentUser?: { status?: string | null; notifyOnMentionOnly?: boolean; nickname?: string | null } | null,
    activeChannelId?: number | null,
    messageChannelId?: number | null,
  ): void => {
    const isWindowVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
    const isAppVisible = $q.appVisible;
    const shouldShowInApp = isWindowVisible && isAppVisible;

    if (!message.sender || !message.content) {
      return;
    }

    if (currentUser?.status === 'dnd') {
      return;
    }

    if (currentUser?.notifyOnMentionOnly === true) {
      const isMentioned = isUserMentioned(message.content, currentUser.nickname || null);
      if (!isMentioned) {
        return;
      }
    }

    const senderName =
      message.sender.nickname ||
      `${message.sender.firstname ?? ''} ${message.sender.surname ?? ''}`.trim() ||
      message.sender.email ||
      'Neznámy používateľ';

    const messagePreview =
      message.content.length > 100
        ? `${message.content.substring(0, 100)}...`
        : message.content;

    const avatarUrl = getFullAvatarUrl(message.sender.profilePicture);

    if (shouldShowInApp) {
      const notifyMessage = channelTitle
        ? `${senderName} v #${channelTitle}: ${messagePreview}`
        : `${senderName}: ${messagePreview}`;

      Notify.create({
        type: 'info',
        message: notifyMessage,
        position: 'top-right',
        timeout: 5000,
        icon: 'chat',
        avatar: avatarUrl,
        actions: [
          {
            icon: 'close',
            color: 'white',
            handler: () => {},
          },
        ],
      });
      return;
    }

    if (!isNotificationSupported) {
      return;
    }

    if (notificationPermission.value !== 'granted') {
      return;
    }

    const notificationTitle = channelTitle ? `#${channelTitle}` : senderName;
    const notificationBody = channelTitle
      ? `${senderName} v #${channelTitle}: ${messagePreview}`
      : `${senderName}: ${messagePreview}`;

    const notification = new Notification(notificationTitle, {
      body: notificationBody,
      icon: avatarUrl,
      badge: avatarUrl,
      tag: `message-${message.id}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 5000);
  };

  const initialize = () => {
    if (isNotificationSupported) {
      if (
        notificationPermission.value !== 'granted' &&
        notificationPermission.value !== 'denied'
      ) {
        void requestPermission();
      }
    }
  };

  return {
    notificationPermission,
    isNotificationSupported,
    requestPermission,
    showMessageNotification,
    initialize,
  };
}
