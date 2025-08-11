/**
 * Settings export/import functionality for user preferences
 * Implements requirement 7.6 - extensibility hooks
 */

import { useState, useCallback } from 'react';
import { Configuration } from '../types';
import { ConfigurationManager } from '../utils/ConfigurationManager';
import { useCustomQuotes } from './useCustomQuotes';

export interface ExportData {
  configuration: Configuration;
  favorites: number[];
  customQuotes: any[];
  pluginSettings: any[];
  metadata: {
    exportDate: string;
    version: string;
    appVersion: string;
    platform: string;
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedItems: {
    configuration: boolean;
    favorites: boolean;
    customQuotes: number;
    pluginSettings: number;
  };
}

export interface ExportOptions {
  includeConfiguration: boolean;
  includeFavorites: boolean;
  includeCustomQuotes: boolean;
  includePluginSettings: boolean;
  format: 'json' | 'compressed';
}

export interface ImportOptions {
  replaceExisting: boolean;
  mergeCustomQuotes: boolean;
  preservePluginSettings: boolean;
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeConfiguration: true,
  includeFavorites: true,
  includeCustomQuotes: true,
  includePluginSettings: true,
  format: 'json'
};

const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  replaceExisting: false,
  mergeCustomQuotes: true,
  preservePluginSettings: false
};

export const useSettingsExportImport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastExportDate, setLastExportDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { exportCustomQuotes, importCustomQuotes } = useCustomQuotes();

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Generate export filename
  const generateExportFilename = useCallback((format: 'json' | 'compressed' = 'json'): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const extension = format === 'compressed' ? 'zip' : 'json';
    return `screensaver-settings-${timestamp}.${extension}`;
  }, []);

  // Export all settings
  const exportSettings = useCallback(async (options: Partial<ExportOptions> = {}): Promise<string | null> => {
    const finalOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
    setIsExporting(true);
    setError(null);

    try {
      const configManager = ConfigurationManager.getInstance();
      const exportData: ExportData = {
        configuration: {} as Configuration,
        favorites: [],
        customQuotes: [],
        pluginSettings: [],
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
          appVersion: '1.0.0',
          platform: navigator.platform
        }
      };

      // Export configuration
      if (finalOptions.includeConfiguration) {
        exportData.configuration = configManager.getConfiguration();
      }

      // Export favorites
      if (finalOptions.includeFavorites) {
        exportData.favorites = Array.from(configManager.getFavorites());
      }

      // Export custom quotes
      if (finalOptions.includeCustomQuotes) {
        const customQuotesJson = exportCustomQuotes();
        if (customQuotesJson) {
          const parsed = JSON.parse(customQuotesJson);
          exportData.customQuotes = parsed.quotes || [];
        }
      }

      // Export plugin settings
      if (finalOptions.includePluginSettings) {
        try {
          const pluginConfig = localStorage.getItem('screensaver-pattern-plugins');
          if (pluginConfig) {
            exportData.pluginSettings = JSON.parse(pluginConfig).plugins || [];
          }
        } catch (error) {
          console.warn('Failed to export plugin settings:', error);
        }
      }

      // Format output
      let result: string;
      if (finalOptions.format === 'compressed') {
        // For now, just use JSON - compression could be added later
        result = JSON.stringify(exportData);
      } else {
        result = JSON.stringify(exportData, null, 2);
      }

      setLastExportDate(new Date());
      console.log('Settings exported successfully');
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      setError(`Export failed: ${errorMessage}`);
      console.error('Export failed:', error);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [exportCustomQuotes]);

  // Import settings
  const importSettings = useCallback(async (
    data: string, 
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> => {
    const finalOptions = { ...DEFAULT_IMPORT_OPTIONS, ...options };
    setIsImporting(true);
    setError(null);

    const result: ImportResult = {
      success: false,
      message: '',
      importedItems: {
        configuration: false,
        favorites: false,
        customQuotes: 0,
        pluginSettings: 0
      }
    };

    try {
      const importData: ExportData = JSON.parse(data);

      // Validate import data structure
      if (!importData.metadata || !importData.metadata.version) {
        throw new Error('Invalid import data format');
      }

      const configManager = ConfigurationManager.getInstance();
      const importedItems: string[] = [];

      // Import configuration
      if (importData.configuration && Object.keys(importData.configuration).length > 0) {
        const configResult = configManager.updateConfiguration(importData.configuration);
        if (configResult.success) {
          result.importedItems.configuration = true;
          importedItems.push('configuration');
        }
      }

      // Import favorites
      if (importData.favorites && Array.isArray(importData.favorites)) {
        if (finalOptions.replaceExisting) {
          // Clear existing favorites first
          configManager.clearFavorites();
        }

        // Add imported favorites
        let favoritesAdded = 0;
        for (const favoriteId of importData.favorites) {
          if (typeof favoriteId === 'number') {
            const addResult = configManager.addFavorite(favoriteId);
            if (addResult.success) {
              favoritesAdded++;
            }
          }
        }

        if (favoritesAdded > 0) {
          result.importedItems.favorites = true;
          importedItems.push(`${favoritesAdded} favorites`);
        }
      }

      // Import custom quotes
      if (importData.customQuotes && Array.isArray(importData.customQuotes)) {
        const quotesJson = JSON.stringify({ quotes: importData.customQuotes });
        const importSuccess = await importCustomQuotes(
          quotesJson, 
          !finalOptions.mergeCustomQuotes
        );
        
        if (importSuccess) {
          result.importedItems.customQuotes = importData.customQuotes.length;
          importedItems.push(`${importData.customQuotes.length} custom quotes`);
        }
      }

      // Import plugin settings
      if (importData.pluginSettings && Array.isArray(importData.pluginSettings)) {
        try {
          const existingPlugins = finalOptions.preservePluginSettings 
            ? JSON.parse(localStorage.getItem('screensaver-pattern-plugins') || '{"plugins":[]}')
            : { plugins: [] };

          const mergedPlugins = finalOptions.preservePluginSettings
            ? [...existingPlugins.plugins, ...importData.pluginSettings]
            : importData.pluginSettings;

          localStorage.setItem('screensaver-pattern-plugins', JSON.stringify({
            plugins: mergedPlugins,
            version: 1,
            timestamp: Date.now()
          }));

          result.importedItems.pluginSettings = importData.pluginSettings.length;
          importedItems.push(`${importData.pluginSettings.length} plugin settings`);
        } catch (error) {
          console.warn('Failed to import plugin settings:', error);
        }
      }

      // Generate result message
      if (importedItems.length > 0) {
        result.success = true;
        result.message = `Successfully imported: ${importedItems.join(', ')}`;
      } else {
        result.message = 'No items were imported';
      }

      console.log('Settings import completed:', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
      setError(`Import failed: ${errorMessage}`);
      result.message = `Import failed: ${errorMessage}`;
      console.error('Import failed:', error);
      return result;
    } finally {
      setIsImporting(false);
    }
  }, [importCustomQuotes]);

  // Download settings as file
  const downloadSettings = useCallback(async (options: Partial<ExportOptions> = {}): Promise<boolean> => {
    const data = await exportSettings(options);
    if (!data) {
      return false;
    }

    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = generateExportFilename(options.format);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      console.log(`Settings downloaded as: ${filename}`);
      return true;
    } catch (error) {
      setError('Failed to download settings file');
      console.error('Download failed:', error);
      return false;
    }
  }, [exportSettings, generateExportFilename]);

  // Upload and import settings from file
  const uploadAndImportSettings = useCallback(async (
    file: File, 
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> => {
    try {
      const text = await file.text();
      return await importSettings(text, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to read file';
      setError(`File upload failed: ${errorMessage}`);
      return {
        success: false,
        message: `File upload failed: ${errorMessage}`,
        importedItems: {
          configuration: false,
          favorites: false,
          customQuotes: 0,
          pluginSettings: 0
        }
      };
    }
  }, [importSettings]);

  // Create backup
  const createBackup = useCallback(async (): Promise<boolean> => {
    const configManager = ConfigurationManager.getInstance();
    const backupResult = configManager.createBackup();
    
    if (backupResult.success) {
      console.log('Backup created successfully');
      return true;
    } else {
      setError('Failed to create backup');
      return false;
    }
  }, []);

  // Restore from backup
  const restoreFromBackup = useCallback(async (): Promise<boolean> => {
    const configManager = ConfigurationManager.getInstance();
    const restoreResult = configManager.restoreFromBackup();
    
    if (restoreResult.success) {
      console.log('Settings restored from backup');
      return true;
    } else {
      setError('Failed to restore from backup');
      return false;
    }
  }, []);

  // Get export preview
  const getExportPreview = useCallback(async (options: Partial<ExportOptions> = {}): Promise<{
    size: number;
    itemCount: {
      configuration: number;
      favorites: number;
      customQuotes: number;
      pluginSettings: number;
    };
  } | null> => {
    const data = await exportSettings(options);
    if (!data) {
      return null;
    }

    try {
      const parsed: ExportData = JSON.parse(data);
      return {
        size: new Blob([data]).size,
        itemCount: {
          configuration: Object.keys(parsed.configuration || {}).length,
          favorites: parsed.favorites?.length || 0,
          customQuotes: parsed.customQuotes?.length || 0,
          pluginSettings: parsed.pluginSettings?.length || 0
        }
      };
    } catch (error) {
      console.error('Failed to generate export preview:', error);
      return null;
    }
  }, [exportSettings]);

  return {
    // State
    isExporting,
    isImporting,
    lastExportDate,
    error,

    // Actions
    exportSettings,
    importSettings,
    downloadSettings,
    uploadAndImportSettings,
    createBackup,
    restoreFromBackup,
    getExportPreview,
    generateExportFilename,
    clearError,

    // Options
    DEFAULT_EXPORT_OPTIONS,
    DEFAULT_IMPORT_OPTIONS
  };
};