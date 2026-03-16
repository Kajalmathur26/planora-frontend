export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const sendNotification = (title, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(title, {
        icon: '/vite.svg', // Default icon
        ...options,
    });
};
