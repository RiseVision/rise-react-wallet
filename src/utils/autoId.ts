let lastAutoId = 0;

// tslint:disable-next-line:no-any
export default function autoId(target: any, key: string) {
    Object.defineProperty(target, key, {
        get: function () {
            if (this.__autoId === undefined) {
                lastAutoId += 1;
                this.__autoId = lastAutoId;
            }
            return `${key}-${this.__autoId}`;
        },
        configurable: true,
        enumerable: true,
    });
}
