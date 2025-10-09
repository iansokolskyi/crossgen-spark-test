import { App, PluginSettingTab, Setting } from 'obsidian';
import { SparkSettings, ISparkPlugin } from './types';

export const DEFAULT_SETTINGS: SparkSettings = {
    enablePalette: true,
    enableChat: true,
    chatHotkey: 'Mod+K',
    vaultPath: '',
    sparkFolder: '.spark'
};

export class SparkSettingTab extends PluginSettingTab {
    plugin: ISparkPlugin;

    constructor(app: App, plugin: ISparkPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Spark Assistant Settings' });

        new Setting(containerEl)
            .setName('Enable Command Palette')
            .setDesc('Enable slash command autocomplete (/ and @)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enablePalette)
                .onChange(async (value) => {
                    this.plugin.settings.enablePalette = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable Chat Widget')
            .setDesc('Enable the floating chat interface')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableChat)
                .onChange(async (value) => {
                    this.plugin.settings.enableChat = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Spark Folder')
            .setDesc('Folder name for Spark configuration (default: .spark)')
            .addText(text => text
                .setPlaceholder('.spark')
                .setValue(this.plugin.settings.sparkFolder)
                .onChange(async (value) => {
                    this.plugin.settings.sparkFolder = value || '.spark';
                    await this.plugin.saveSettings();
                }));
    }
}

