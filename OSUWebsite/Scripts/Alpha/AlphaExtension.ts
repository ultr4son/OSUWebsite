interface AlphaModule {
    isAction(act: string): boolean;
    toAction(act: string): AlphaAction;
    getRegister(register: string): number;
    
}
interface AlphaAction {
    execute(args: number[]): void;
    module: AlphaModule;
    core: AlphaModule;
}

class AlphaCore implements AlphaModule {
    static associationTable =
    [
        "a",    "acc",        
        "b",    "jgz",
        "c",    "jez",
        "d",    "jlz",
        "e",    "jmp",
        "g",    "giv",
        "o",    "oc",
        "n",    "on",
        "p",    "push",
        "l",    "pop",
        "f",    "flush",
        "z",    "nop",
    ]

}