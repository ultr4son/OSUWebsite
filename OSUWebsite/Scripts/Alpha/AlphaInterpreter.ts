module Alpha {
    export interface AlphaInput {
        input(): number
    }
    export interface AlphaOutput {
        outNumeric (numeric: number): void;
        outChar (char: string): void;
    }
    export interface AlphaBreakpointHandler {
        breakpoint(interpreter: AlphaInterpreter): void;
    }

    export class AlphaInterpreter {
        exacutable: AlphaExacutable;
        accumulator: number = 0;
        stack: number[] = [];
        inputReader: AlphaInput;
        outputWriter: AlphaOutput;
        breakpointHandler: AlphaBreakpointHandler;
        constructor(exacutable: AlphaExacutable, input: AlphaInput, output: AlphaOutput, breakpoint: AlphaBreakpointHandler) {
            this.exacutable = exacutable;
            this.outputWriter = output;
            this.inputReader = input;
            this.breakpointHandler = breakpoint;
        }
        public runBlock() {
            if (this.exacutable.executionStream.atEnd()) {
                throw "Out of things to execute!";
            }
            var block = this.exacutable.executionStream.read();
            try {
                this.exec(block, this.exacutable.jumpTable);
            } catch (err) {
                this.outputWriter.outChar(err);
            }
            if (block.breakpoint) {
                this.breakpointHandler.breakpoint(this);
            }
        }
        public atEnd() {
            return this.exacutable.executionStream.atEnd();
        }
        private exec(block: AlphaBlock, jumpTable: { [tagName: string]: number }) {
            if (block.blockType == BlockType.TAG) {
                return; //Nothing to do here.
            }
            var value: number;
            if (block.blockType == BlockType.ACTION_TAG_ARG) {
                value = jumpTable[block.value];
            }
            else {
                if (block.value == "A") {
                    value = this.accumulator;
                }
                else if (block.value == "Z") {
                    value = -this.accumulator;
                }
                else if (block.value == "S") {
                    if (this.stack.length > 0) {
                        value = this.stack.pop();
                    }
                    else {
                        value = 0;
                    }
                }
                else if (block.value == "I") {
                    value = this.inputReader.input();
                }
                value = <number>block.value;
            }
            switch (block.actionType) {
                case ActionType.ACCUMULATE:
                    this.accumulate(value);
                    break;
                case ActionType.ASSIGN:
                    this.accumulator = value;
                    break;
                case ActionType.FLUSH:
                    this.stack = [];
                    break;
                case ActionType.JMP:
                    this.exacutable.executionStream.jumpTo(value);
                    break;
                case ActionType.JMP_GREATER:
                    if (this.accumulator > 0) {
                        this.exacutable.executionStream.jumpTo(value);
                    }
                    break;
                case ActionType.JMP_LESS:
                    if (this.accumulator < 0) {
                        this.exacutable.executionStream.jumpTo(value);
                    }
                    break;
                case ActionType.JMP_ZERO:
                    if (this.accumulator == 0) {
                        this.exacutable.executionStream.jumpTo(value);
                    }
                    break;
                case ActionType.OUTPUT_CHAR:
                    this.outputWriter.outChar(String.fromCharCode(this.accumulator));
                    break;
                case ActionType.OUTPUT_NUMBER:
                    this.outputWriter.outNumeric(this.accumulator);
                    break;
                case ActionType.POP:
                    if (this.stack.length > 0) {
                        this.accumulator = this.stack.pop();
                    }
                    else {
                        this.accumulator = 0;
                    }
                    break;
                case ActionType.PUSH:
                    this.stack.push(this.accumulator);
                    break;
                case ActionType.NOP:
                    break;

                case ActionType.NONE:
                default:
                    throw "Invalid action";
            }
        }
        private accumulate(amount: number) {
            this.accumulator += amount;
        }
        

    }
}