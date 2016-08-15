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
        public runAlphaInterpreter() {
            this.stopInterpreter = false;
            this.inputReader.reset();
            this.outputWriter.reset();
            var code = this.codeElement.value;
            var converter = new Alpha.AlphaReader(code);
            try {
                var exacutable = converter.process();
            }
            catch (err) {
                this.outputWriter.outChar(err);
                return;
            }
            this.interpreter = new Alpha.AlphaInterpreter(exacutable, this.inputReader, this.outputWriter, this.breakpointHandler);
            this.runAlphaPeriodic();
        }
        public runAlphaPeriodic() {
            window.setTimeout(this.runAlphaPeriodicHandler, 1, this);
        }
        public step() {
            this.interpreter.runBlock();
            this.breakpointHandler.breakpoint(this.interpreter);
        }
        public pause() {
            this.breakpointHandler.break = true;
            this.breakpointHandler.breakpoint(this.interpreter);
        }
        public stop() {
            this.stopInterpreter = true;
        }
        public continue() {
            this.breakpointHandler.break = false;
        }
        private runAlphaPeriodicHandler(ui: AlphaUIHandler) {
            if (ui.interpreter == undefined) {
                console.error("Interpreter hasn't been setup!");
                return;
            }
            if (ui.interpreter.atEnd()) {
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
        outChar(char: string) {
            this.outputElement.value += char;
        }
        outNumeric(numeric: number) {
            this.outputElement.value += numeric.toString();
        }
        public reset() {
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
        public reset() {
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
        breakpoint(interpreter: AlphaInterpreter) {
            this.statusElement.innerHTML = "A: " + interpreter.accumulator; + "\n" + "S: " + interpreter.stack; + "\n" + "Index: " + interpreter.exacutable.executionStream.index;
            this.break = true;
        }

    }
}