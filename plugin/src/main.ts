import { Plugin } from 'obsidian';
import { SparkSettingTab, DEFAULT_SETTINGS } from './settings';
import { SparkSettings, ISparkPlugin } from './types';

export default class SparkPlugin extends Plugin implements ISparkPlugin {
    settings: SparkSettings;

    async onload() {
        console.log('Spark Assistant: Loading plugin...');

        // Load settings
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new SparkSettingTab(this.app, this));

        // Add status bar item
        const statusBarItem = this.addStatusBarItem();
        statusBarItem.setText('⚡ Spark');

        console.log('Spark Assistant: Plugin loaded successfully');
    }

    async onunload() {
        console.log('Spark Assistant: Plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

