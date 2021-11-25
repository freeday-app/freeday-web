import ImageResizer from 'react-image-file-resizer';

// utilities for input files
const File = {

    controlSize(file, maxSizeInMb) {
        const fileSizeInMb = file.size / 1000000;
        return fileSizeInMb <= maxSizeInMb;
    },

    async controlDimensions(file, maxWidth, maxHeight) {
        return new Promise((res, rej) => {
            try {
                const Url = window.URL || window.webkitURL;
                const image = new Image();
                const objectUrl = Url.createObjectURL(file);
                image.onload = (i) => {
                    Url.revokeObjectURL(objectUrl);
                    res(i.target.width <= maxWidth && i.target.height <= maxHeight);
                };
                image.src = objectUrl;
            } catch (err) {
                rej(err);
            }
        });
    },

    async convertImageToBase64(file) {
        return new Promise((res, rej) => {
            try {
                const fileReader = new FileReader();
                fileReader.addEventListener('error', () => {
                    rej(fileReader.error);
                });
                fileReader.addEventListener('load', (fileReaderEvent) => {
                    res(fileReaderEvent.target.result);
                });
                fileReader.readAsDataURL(file);
            } catch (err) {
                rej(err);
            }
        });
    },

    async resizeImageToBase64(file, maxWidth, maxHeight) {
        return new Promise((res) => {
            ImageResizer.imageFileResizer(
                file,
                maxWidth,
                maxHeight,
                'PNG',
                100,
                0,
                (uri) => {
                    res(uri);
                },
                'base64'
            );
        });
    }

};

export default File;
