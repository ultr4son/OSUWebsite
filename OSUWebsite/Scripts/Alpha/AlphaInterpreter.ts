module Alpha {
    /**
    * Input to the AlphaInterpreter. Must return 0 if there is no more input.
    */
    export interface AlphaInput {
        input(): number
    }
    /**
    * AlphaInterpreter output. 
    */
    export interface AlphaOutput {
        outNumeric (numeric: number): void;
        outStr (str: string): void;
    }
    /**
    * Callback interface for when the interpreter detects a breakpoint.
    */
    export interface AlphaBreakpointHandler {
        breakpoint(interpreter: AlphaInterpreter): void;
    }

    /**
     * Class that handles the interpretetation of an AlphaExecutable.
     */
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
        /**
         * Runs a single processed block of Alpha. Throws an error if there are no more blocks to read.
         */
        public runBlock(): void {
            if (this.exacutable.executionStream.atEnd()) {
                throw "Out of things to execute!";
            }
            var block = this.exacutable.executionStream.read();
            try {
                this.exec(block);
            } catch (err) {
                this.outputWriter.outStr(err);
            }
            if (block.breakpoint) {
                this.breakpointHandler.breakpoint(this);
            }
        }
        /**
         * Returns true if there are no more blocks to execute.
         */
        public atEnd(): boolean {
            return this.exacutable.executionStream.atEnd();
        }
        /**
         * Extract the numerical representation of a block value
         * @param block The block to extract.
         */
        private readValue(block: AlphaBlock): number {
            var value;
            if (block.blockType == BlockType.ACTION_TAG_ARG) {
                value = this.exacutable.jumpTable[block.value];
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
                else {
                    value = <number>block.value;
                }
            }
            return value;
        }
        /**
         * Execute a block of alpha code.
         * @param block The block to execute.
         */
        private exec(block: AlphaBlock): void {
            if (block.blockType == BlockType.TAG) {
                return; //Nothing to do here.
            }
            var value: number = this.readValue(block);
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
                    this.outputWriter.outStr(String.fromCharCode(this.accumulator));
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

        private accumulate(amount: number): void {
            this.accumulator += amount;
        }
        

    }
}