export default class FileUtils {
    static getSizeDescription(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let unitIndex = 0;

        while (bytes >= 1024 && unitIndex < units.length - 1) {
            bytes /= 1024;
            unitIndex++;
        }

        return `${bytes.toFixed(2)} ${units[unitIndex]}`;
    }

    static isFilenameValid(name: string): boolean {
        // forbidden characters \ / : * ? " < > |
        const rg1=/^[^\\/:\*\?"<>\|]+$/;

        // cannot start with dot (.)
        const rg2=/^\./;

        // forbidden file names
        const rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i;

        return rg1.test(name) && !rg2.test(name) && !rg3.test(name)
    }
}
