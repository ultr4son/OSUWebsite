class Stream<StreamType> {
    constructor(toStream: StreamType[]) {
        this.raw = toStream;
        this.index = 0;
    }
    raw: StreamType[];
    index: number;
    public read(): StreamType {
        var r = this.raw[this.index];
        this.index++;
        return r;
    }
    public unRead(): void {
        if (!this.atStart()) {
            this.index--;
        }

    }
    public peek(): StreamType {
        return this.raw[this.index];
    }
    public getIndex(): number {
        return this.index;
    }
    public atEnd(): boolean {
        return this.index == this.raw.length;
    }
    public atStart(): boolean {
        return this.index == 0;
    }
    public jumpTo(index: number) {
        if (index > this.raw.length) {
            throw index + " out of range";
        }
        this.index = index;
    }

}