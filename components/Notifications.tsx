import React from 'react';
import { TrophyIcon, UsersIcon, BellIcon, QuizIcon, MatchIcon } from './icons';
// FIX: Changed import to correctly handle 'Page' as a value for navigation,
// while keeping 'Notification' as a type-only import to resolve TypeScript errors.
import { type Notification, Page } from '../types';

interface NotificationsProps {
    notifications: Notification[];
    onNavigate: (page: Page, context?: any) => void;
    onMarkAsRead: (id: number) => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    const iconContainerClass = "p-2 rounded-full flex items-center justify-center h-10 w-10";
    const baseIconClass = "w-6 h-6 text-white";

    switch (type) {
        case 'challenge':
            return <div className={`${iconContainerClass} bg-green-500`}><UsersIcon className={baseIconClass} /></div>;
        case 'quiz':
            // Use the filled version of QuizIcon directly to match the user's screenshot
            return <QuizIcon className="w-10 h-10 text-purple-500" fill="currentColor" />;
        case 'contest':
            return <div className={`${iconContainerClass} bg-yellow-500`}><TrophyIcon className={baseIconClass} /></div>;
        case 'win':
            return <div className={`${iconContainerClass} bg-green-500`}><BellIcon className={baseIconClass} fill="currentColor" /></div>;
        case 'loss':
            return <div className={`${iconContainerClass} bg-red-500`}><UsersIcon className={baseIconClass} /></div>;
        case 'match':
            return <div className={`${iconContainerClass} bg-blue-500`}><MatchIcon className={baseIconClass} /></div>;
        default:
            return <div className={`${iconContainerClass} bg-gray-500`}><BellIcon className={baseIconClass} /></div>;
    }
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onNavigate, onMarkAsRead }) => {

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }

        switch (notification.type) {
            case 'challenge':
                 onNavigate(Page.Matchs, { tab: 'defis', matchId: notification.matchId });
                 break;
            case 'match':
            case 'win':
            case 'loss':
                onNavigate(Page.Matchs);
                break;
            case 'quiz':
                onNavigate(Page.Quiz);
                break;
            case 'contest':
                onNavigate(Page.Concours);
                break;
            default:
                // Do nothing for unknown types
                break;
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Notifications</h1>
            <div className="bg-[var(--color-card-bg)] rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-[var(--color-border)]">
                    {notifications.map(notif => (
                        <li key={notif.id} className={`transition-colors ${notif.read ? 'bg-gray-50 dark:bg-black/10' : ''}`}>
                            <button 
                                onClick={() => handleNotificationClick(notif)}
                                className="w-full text-left p-4 flex items-center space-x-4 hover:bg-[var(--color-bg-secondary)]"
                                aria-label={`Notification : ${notif.text}`}
                            >
                                <NotificationIcon type={notif.type} />
                                <div className="flex-grow">
                                    <p className="text-sm text-[var(--color-text-primary)]">{notif.text}</p>
                                    <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">{notif.time}</p>
                                </div>
                                {!notif.read && (
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Notifications;