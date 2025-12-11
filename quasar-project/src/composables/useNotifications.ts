import { ref } from 'vue';
import { useQuasar, Notify } from 'quasar';
import type { MessageFromApi } from './useMessages';
import { api } from 'boot/api';

const defaultUserAvatar = new URL('../assets/default_user_avatar.png', import.meta.url).href;

/**
 * Pomocná funkcia na získanie plnej URL avatara
 */
const getFullAvatarUrl = (path: string | null | undefined): string => {
  if (!path) return defaultUserAvatar;
  if (path.startsWith('http')) return path;

  const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
};

/**
 * Composable pre správu notifikácií pre nové správy
 * Notifikácie sa zobrazujú iba ak aplikácia nie je viditeľná (appVisible === false)
 */
export function useNotifications() {
  const $q = useQuasar();
  const notificationPermission = ref<NotificationPermission>(
    typeof window !== 'undefined' && typeof Notification !== 'undefined'
      ? Notification.permission
      : 'default',
  );

  const isNotificationSupported =
    typeof window !== 'undefined' && typeof Notification !== 'undefined';

  /**
   * Požiada o povolenie na notifikácie
   */
  const requestPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported) {
      console.warn('Notifikácie nie sú podporované v tomto prehliadači');
      return false;
    }

    if (notificationPermission.value === 'granted') {
      return true;
    }

    if (notificationPermission.value === 'denied') {
      console.warn('Povolenie na notifikácie bolo zamietnuté');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      notificationPermission.value = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Chyba pri žiadaní o povolenie na notifikácie:', error);
      return false;
    }
  };

  /**
   * Zobrazí notifikáciu pre novú správu
   * @param message - Správa, pre ktorú sa má zobraziť notifikácia
   * @param channelTitle - Názov kanála (voliteľné)
   */
  const showMessageNotification = (
    message: MessageFromApi,
    channelTitle?: string | null,
  ): void => {
    console.log('🔔 showMessageNotification called:', {
      appVisible: $q.appVisible,
      channelTitle,
      sender: message.sender?.nickname || message.sender?.email,
      content: message.content?.substring(0, 50),
    });

    // Validácia správy
    if (!message.sender || !message.content) {
      console.warn('Správa nemá odosielateľa alebo obsah');
      return;
    }

    // Získanie mena odosielateľa
    const senderName =
      message.sender.nickname ||
      `${message.sender.firstname ?? ''} ${message.sender.surname ?? ''}`.trim() ||
      message.sender.email ||
      'Neznámy používateľ';

    // Získanie časti správy (max 100 znakov)
    const messagePreview =
      message.content.length > 100
        ? `${message.content.substring(0, 100)}...`
        : message.content;

    // Získanie URL avatara
    const avatarUrl = getFullAvatarUrl(message.sender.profilePicture);

    // Ak je aplikácia viditeľná, zobraziť Quasar Notify notifikáciu priamo v aplikácii
    if ($q.appVisible) {
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
            handler: () => {
              /* explicit close handler */
            },
          },
        ],
      });
      return;
    }

    // Systémová notifikácia (keď aplikácia nie je viditeľná)
    if (!isNotificationSupported) {
      console.warn('Notifikácie nie sú podporované');
      return;
    }

    if (notificationPermission.value !== 'granted') {
      console.warn('Povolenie na notifikácie nie je udelené');
      return;
    }

    // Vytvorenie systémovej notifikácie - názov kanála v title, odosielateľ a správa v body
    const notificationTitle = channelTitle ? `#${channelTitle}` : senderName;
    const notificationBody = channelTitle
      ? `${senderName} v #${channelTitle}: ${messagePreview}`
      : `${senderName}: ${messagePreview}`;

    console.log('✅ Zobrazujem systémovú notifikáciu:', {
      title: notificationTitle,
      body: notificationBody,
      icon: avatarUrl,
    });

    const notification = new Notification(notificationTitle, {
      body: notificationBody,
      icon: avatarUrl,
      badge: avatarUrl,
      tag: `message-${message.id}`, // Tag pre zoskupenie notifikácií
      requireInteraction: false,
    });

    // Pri kliknutí na notifikáciu sa aplikácia zobrazí
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Automaticky zatvoriť notifikáciu po 5 sekundách
    setTimeout(() => {
      notification.close();
    }, 5000);
  };

  /**
   * Inicializácia - požiada o povolenie pri načítaní
   */
  const initialize = () => {
    if (isNotificationSupported) {
      // Požiadať o povolenie iba ak ešte nebolo udelené alebo zamietnuté
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

