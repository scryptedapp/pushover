import sdk, { ScryptedDeviceBase, Notifier, Settings, NotifierOptions, MediaObject, Setting, SettingValue } from '@scrypted/sdk';
import { StorageSetting, StorageSettings, StorageSettingsDict } from '@scrypted/sdk/storage-settings';
import PushoverClient from 'pushover-notifications';
const { mediaManager } = sdk;

const sounds = [
    'pushover',
    'bike',
    'bugle',
    'cashregister',
    'classical',
    'cosmic    ',
    'falling',
    'gamelan',
    'incoming',
    'intermission',
    'magic',
    'mechanical',
    'pianobar',
    'siren',
    'spacealarm',
    'tugboat',
    'alien',
    'climb',
    'persistent',
    'echo',
    'updown',
    'vibrate',
    'none',
];

const priorities = {
    'No Alert': -2,
    'Quiet': -1,
    'Normal': 0,
    'High': 1,
    'Require Confirmation': 2,
};

type StorageSettingKeys = 'username' | 'password' | 'device' | 'sound' | 'priority';

export const storageSettingsDic: StorageSettingsDict<StorageSettingKeys> = {
    username: {
        title: 'User Key',
    },
    password: {
        type: 'password',
        title: 'Token',
    },
    device: {
        title: 'Device',
        key: 'device',
        description: 'Send notifications to specific device. Leaving this blank will send to all devices.',
    },
    sound: {
        title: 'Sound',
        key: 'sound',
        description: 'Notification Sound',
        choices: sounds,
        defaultValue: 'none',
    },
    priority: {
        title: 'Priority',
        key: 'priority',
        description: 'Notification Priority',
        choices: Object.keys(priorities),
        defaultValue: 'Normal',
    },
}

export class PushoverNotifier extends ScryptedDeviceBase implements Notifier, Settings {
    storageSettings = new StorageSettings(this, storageSettingsDic);

    constructor(nativeId: string) {
        super(nativeId);
    }

    async sendNotification(title: string, options?: NotifierOptions, media?: MediaObject | string, icon?: MediaObject | string): Promise<void> {
        const { username, password } = this.storageSettings.values;
        const push = new PushoverClient({
            user: username,
            token: password,
        });

        let data: Buffer;
        if (typeof media === 'string')
            media = await mediaManager.createMediaObjectFromUrl(media as string);
        if (media)
            data = await mediaManager.convertMediaObjectToBuffer(media as MediaObject, 'image/*');

        const additionalProps = options?.data?.pushover ?? {};

        const msg = {
            message: options?.body || options?.subtitle,
            title,
            sound: this.storageSettings.values.sound,
            device: this.storageSettings.values.device,
            priority: priorities[this.storageSettings.values.priority],
            file: data ? { name: 'media.jpg', data } : undefined,
            ...additionalProps,
        };

        return new Promise((resolve, reject) => {
            push.send(msg, (err: Error, result: any) => {
                if (err) {
                    this.console.error('pushover error', err);
                    return reject(err);
                }

                this.console.log('pushover success', result);
                resolve();
            })
        })
    }

    async getSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    async putSetting(key: string, value: SettingValue): Promise<void> {
        return this.storageSettings.putSetting(key, value);
    }
}
