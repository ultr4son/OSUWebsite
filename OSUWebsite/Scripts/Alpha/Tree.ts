module Structure {
    interface BranchTable<DataType> {
        [key: string]: Branch<DataType>;
    }
    class Branch<DataType> {
        data: DataType
        parent: Branch<DataType>
        children: BranchTable<DataType>;
        constructor(data?: DataType) {
            this.data = data || undefined;
            this.children = {};
            this.parent = null;
        }
    }
    export class Tree<DataType> {
        root: Branch<DataType>;
        current: Branch<DataType>;
        constructor() {
            this.root = new Branch<DataType>();
            this.current = this.root;
        }
        public addBranch(key: string, data: DataType) {
            this.current.children[key] = new Branch<DataType>();
        }
        public goDown(key: string) {
            this.current = this.current.children[key];
        }
        public goUp() {
            if (this.current.parent != null) {
                this.current = this.current.parent;
            }
        }
        public childExists(key: string) {
            return this.current.children[key] != undefined;
        }
        public getBranchData(): DataType {
            return this.current.data;
        }


    }
}