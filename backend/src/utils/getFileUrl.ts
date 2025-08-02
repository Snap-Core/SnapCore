import { Request } from 'express';

export function getUploadedFileUrl(req: Request): string | null {
    const file: any = req.file;

    if (!file) return null;

    if (file.location) {
        return `/uploads/${file.location.substring(file.location.lastIndexOf('/') + 1)}`;
    }

    if (file.filename) {
        return `/uploads/${file.filename} `;
    }

    return null;
}
