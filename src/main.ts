import sdk, { DeviceCreator, DeviceCreatorSettings, ScryptedDeviceBase, ScryptedDeviceType, ScryptedInterface, Setting } from "@scrypted/sdk";
import { PushoverNotifier, storageSettingsDict } from "./notifier";
import { randomBytes } from "crypto";
import { StorageSettings } from "@scrypted/sdk/storage-settings";
const { deviceManager } = sdk;

class PushoverProvider extends ScryptedDeviceBase implements DeviceCreator {
    devices = new Map<string, any>();

    getScryptedDeviceCreator(): string {
        return 'Pushover notifier';
    }

    getDevice(nativeId: string) {
        let ret = this.devices.get(nativeId);
        if (!ret) {
            ret = this.createNotifier(nativeId);
            if (ret)
                this.devices.set(nativeId, ret);
        }
        return ret;
    }

    updateDevice(nativeId: string, name: string, interfaces: string[], type?: ScryptedDeviceType) {
        return deviceManager.onDeviceDiscovered({
            nativeId,
            name,
            interfaces,
            type: type || ScryptedDeviceType.Notifier,
            info: deviceManager.getNativeIds().includes(nativeId) ? deviceManager.getDeviceState(nativeId)?.info : undefined,
        });
    }

    async createDevice(settings: DeviceCreatorSettings, nativeId?: string): Promise<string> {
        nativeId ||= randomBytes(4).toString('hex');
        const target = settings.device || 'all devices';
        const name = `Pushover ${target}`;
        await this.updateDevice(nativeId, name, [ScryptedInterface.Settings, ScryptedInterface.Notifier]);
        const device = await this.getDevice(nativeId) as PushoverNotifier;
        nativeId = device.nativeId;

        Object.entries(settings).forEach(([key, value]) => {
            device.storageSettings.values[key] = value;
        });

        return nativeId;
    }

    async getCreateDeviceSettings(): Promise<Setting[]> {
        try {
            const storageSettings = new StorageSettings(this, storageSettingsDict);
            return await storageSettings.getSettings();
        } catch (e) {
            this.console.log(e);
        }
    }

    createNotifier(nativeId: string) {
        return new PushoverNotifier(nativeId);
    }
}

export default PushoverProvider;
