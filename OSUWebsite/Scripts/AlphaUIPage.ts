
window.onload = () => {
    var input = <HTMLTextAreaElement>document.getElementById("input");
    var output = <HTMLTextAreaElement> document.getElementById("output");
    var code = <HTMLTextAreaElement>document.getElementById("code");
    var status = <HTMLParagraphElement> document.getElementById("status");

    
    var uiHandler = new Alpha.AlphaUIHandler(input, output, code, status);

    var runButton = document.getElementById("run");
    var stopButton = document.getElementById("stop");
    var pauseButton = document.getElementById("pause");
    var stepButton = document.getElementById("step");
    var continueButton = document.getElementById("continue");

    runButton.onclick = (ev: any) => {
        try {
            uiHandler.setupAlphaInterpreter();
        } catch (err) {
            return;
        }
        uiHandler.runAlphaPeriodic();
    };
    stopButton.onclick = uiHandler.stop;
    pauseButton.onclick = uiHandler.pause;
    stepButton.onclick = uiHandler.step;
    continueButton.onclick = uiHandler.continue;
}