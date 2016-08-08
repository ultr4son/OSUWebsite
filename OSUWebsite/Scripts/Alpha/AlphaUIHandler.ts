module Alpha {

    interface UIEnvironment {
        executionHandle: number;
        interpreter: AlphaInterpreter;
    }
  
    export class AlphaUIHandler {
        intervalHandle: number;
        interpreter: AlphaInterpreter;
        break: boolean = false;

        codeElement: HTMLTextAreaElement;
        statusElement: HTMLParagraphElement;

        inputReader: AlphaUIInput;
        outputWriter: AlphaUIOutput;
        breakpoint: Alpha.BreakpointHandler = function (interpreter: Alpha.AlphaInterpreter) {
            this.statusElement.innerHTML = "A: " + interpreter.accumulator; + "\n" + "S: " + interpreter.stack; + "\n" + "Index: " + interpreter.exacutable.executionStream.index;
            this.break = true;
        }
        constructor(inputElement: HTMLTextAreaElement, outputElement: HTMLTextAreaElement, codeElement: HTMLTextAreaElement, breakpointElement: HTMLParagraphElement) {
            inputElement = inputElement;
            this.outputWriter = new AlphaUIOutput(outputElement);
            this.inputReader = new AlphaUIInput(inputElement);
            this.codeElement = codeElement;
            this.statusElement = breakpointElement;


        }
        public setupAlphaInterpreter() {
            var code = this.codeElement.value;
            var converter = new Alpha.AlphaReader(code, this.outputWriter);
            var exacutable = converter.process();
            this.interpreter = new Alpha.AlphaInterpreter(exacutable, this.inputReader, this.outputWriter, this.breakpoint);
        }
        public runAlphaPeriodic() {
            this.intervalHandle = window.setInterval(this.runAlphaPeriodicHandler, 1, this);
        }
        public step() {
            this.interpreter.runBlock();
            this.breakpoint(this.interpreter);
        }
        public pause() {
            this.break = true;
            this.breakpoint(this.interpreter);
        }
        public stop() {
            if (this.intervalHandle != undefined) {
                window.clearInterval(this.intervalHandle);
            }
        }
        public continue() {
            this.break = false;
        }
        private runAlphaPeriodicHandler(ui: AlphaUIHandler) {
            if (ui.interpreter == undefined) {
                console.error("Interpreter hasn't been setup!");
                window.clearInterval(ui.intervalHandle)
                return;
            }
            if (this.break) {
                return;
            }
            if (ui.interpreter.atEnd()) {
                window.clearInterval(ui.intervalHandle);
                ui.intervalHandle = undefined;
            }
            ui.interpreter.runBlock();
        }
    }
    class AlphaUIOutput implements AlphaOutput {
        outputElement: HTMLTextAreaElement
        outChar(char: string) {
            this.outputElement.value += char;
        }
        outNumeric(numeric: number) {
            this.outputElement.value += numeric.toString();
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
            var input = this.inputElement.value.substring(0, this.inputIndex).charCodeAt(0);
            this.inputIndex++;
            return input;
        }
    }
}