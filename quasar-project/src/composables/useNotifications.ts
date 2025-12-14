import { ref } from 'vue';
import { useQuasar } from 'quasar';
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
    } catch {
      return false;
    }
  };

  const isUserMentioned = (messageContent: string, userNickname: string | null): boolean => {
    if (!userNickname || !messageContent) return false;
    
    // Escapovať špeciálne znaky v nickname pre regex
    const escapedNickname = userNickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Hľadať presne @nickname s word boundary (začína s @ a končí s word boundary)
    // \B zaisťuje, že @ nie je súčasťou iného slova
    // \b zaisťuje, že nickname končí na word boundary
    // Používame match() namiesto test() aby sme sa vyhli problémom s global flagom
    const mentionRegex = new RegExp(`\\B@${escapedNickname}\\b`, 'i');
    const matches = messageContent.match(mentionRegex);
    
    return matches !== null && matches.length > 0;
  };

  const showMessageNotification = (
    message: MessageFromApi,
    channelTitle?: string | null,
    currentUser?: { 
      status?: string | null; 
      connection?: string | null;
      notifyOnMentionOnly?: boolean; 
      nickname?: string | null 
    } | null,
    activeChannelId?: number | null,
    messageChannelId?: number | null,
  ): void => {
    const isWindowVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
    const isAppVisible = $q.appVisible;
    const isAppNotVisible = !isWindowVisible || !isAppVisible;

    if (!message.sender || !message.content) {
      return;
    }

    // OFFLINE - žiadne notifikácie (a WebSocket je odpojený)
    if (currentUser?.connection === 'offline') {
      return;
    }

    // DND - žiadne notifikácie
    if (currentUser?.status === 'dnd') {
      return;
    }

    const isMentioned = isUserMentioned(message.content, currentUser?.nickname || null);
    const isInSameChannel = activeChannelId !== null && messageChannelId !== null && activeChannelId === messageChannelId;

    // Ak som v tom istom kanáli, notifikácia sa nezobrazí
    if (isInSameChannel) {
      return;
    }

    // AWAY a ONLINE - rovnaké správanie (normálne notifikácie)
    // Ak má zapnuté "mentions only", notifikácia sa zobrazí LEN ak je používateľ spomenutý
    if (currentUser?.notifyOnMentionOnly === true) {
      // LEN A LEN ak je tam @MOJ_NICKNAME, inak nie!
      if (!isMentioned) {
        return;
      }
      // Ak je spomenutý, pokračuj ďalej a zobraz notifikáciu
    } else {
      // Normálny režim (ONLINE/AWAY) - notifikácie len keď nie je app viditeľná (minimalizovaná)
      if (!isAppNotVisible) {
        return;
      }
    }

    if (!isNotificationSupported) {
      return;
    }

    if (notificationPermission.value !== 'granted') {
      return;
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
