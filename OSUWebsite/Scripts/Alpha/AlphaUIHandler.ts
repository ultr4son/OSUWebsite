module Alpha {
  
    export class AlphaUIHandler {
        interpreter: AlphaInterpreter;
        stopInterpreter: boolean;
        codeElement: HTMLTextAreaElement;
        statusElement: HTMLParagraphElement;

        inputReader: AlphaUIInput;
        outputWriter: AlphaUIOutput;
        breakpointHandler: AlphaUIBreakpoint;
        
        constructor(inputElement: HTMLTextAreaElement, outputElement: HTMLTextAreaElement, codeElement: HTMLTextAreaElement, breakpointElement: HTMLParagraphElement) {
            this.outputWriter = new AlphaUIOutput(outputElement);
            this.inputReader = new AlphaUIInput(inputElement);
            this.breakpointHandler = new AlphaUIBreakpoint(breakpointElement)
            this.codeElement = codeElement;
        }
        /**
         * Sets up and runs an instance of an alpha interpreter.
         */
        public runAlphaInterpreter():void {
            this.stopInterpreter = false;
            this.inputReader.reset();
            this.outputWriter.reset();
            var code = this.codeElement.value;
            var converter = new Alpha.AlphaReader(code);
            try {
                var exacutable = converter.process();
            }
            catch (err) {
                this.outputWriter.outStr(err);
                return;
            }
            this.interpreter = new Alpha.AlphaInterpreter(exacutable, this.inputReader, this.outputWriter, this.breakpointHandler);
            this.runAlphaPeriodic();
        }
        /**
         * Set a timeout for one ms from now to run the periodic handler
         */
        private runAlphaPeriodic(): void {
            window.setTimeout(this.runAlphaPeriodicHandler, 1, this);
        }
        /**
         * Run a single block and update the breakpoint handler.
         */
        public step(): void {
            if (this.interpreter.atEnd()) {
                return;
            }
            this.interpreter.runBlock();
            this.breakpointHandler.breakpoint(this.interpreter);
        }
        /**
         * Stop execution and update the breakpoint handler.
         */
        public pause(): void {
            this.breakpointHandler.break = true;
            this.breakpointHandler.breakpoint(this.interpreter);
        }
        /**
         * Tell the periodic handler to stop executing.
         */
        public stop(): void {
            this.stopInterpreter = true;
        }
        /**
         * Continue normal execution
         */
        public continue(): void {
            this.breakpointHandler.break = false;
        }
        /**
         * Handles a single step of execution. Will schedule itself if a block is run.
         * @param ui The executing AlphaUIHandler
         */
        private runAlphaPeriodicHandler(ui: AlphaUIHandler): void {
            if (ui.interpreter == undefined) {
                console.error("Interpreter hasn't been setup!");
                return;
            }
            if (ui.interpreter.atEnd() || ui.stopInterpreter) {
                return; //This will cancel the next immediate.
            }

            if (ui.breakpointHandler.break) {
                ui.runAlphaPeriodic();
                return;
            }

            ui.interpreter.runBlock();
            ui.runAlphaPeriodic();
        }
    }
    //These classes are necessary because when they are called as handlers, the this object points to the interpreter, not the AlphaUIHandler instance.
    class AlphaUIOutput implements AlphaOutput {
        outputElement: HTMLTextAreaElement
        outStr(char: string): void {
            this.outputElement.value += char;
        }
        outNumeric(numeric: number): void {
            this.outputElement.value += numeric.toString();
        }
        public reset(): void {
            this.outputElement.value = "";
        }
        constructor(output: HTMLTextAreaElement) {
            this.outputElement = output;
        }
    }
    class AlphaUIInput implements AlphaInput {
        inputElement: HTMLTextAreaElement;
        inputIndex: number = 0;
        constructor(inputElement: HTMLTextAreaElement) {
            this.inputElement = inputElement;
        }
        public reset(): void {
            this.inputIndex = 0;
        }
        input(): number {
            if (this.inputIndex > this.inputElement.value.length) {
                return 0;
            }
            var input = this.inputElement.value.substring(0, this.inputIndex).charCodeAt(0);
            this.inputIndex++;
           
            return input;
        }
    }
    class AlphaUIBreakpoint implements AlphaBreakpointHandler {
        statusElement: HTMLParagraphElement;
        break: boolean = false;
        constructor(statusElement: HTMLParagraphElement) {
            this.statusElement = statusElement;
        }
        breakpoint(interpreter: AlphaInterpreter): void {
            this.statusElement.innerHTML = "A: " + interpreter.accumulator; + "\n" + "S: " + interpreter.stack; + "\n" + "Index: " + interpreter.exacutable.executionStream.index;
            this.break = true;
        }

    }
}