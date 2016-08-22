module Alpha {

    
  
    export enum BlockType {
        TAG,
        ACTION,
        ACTION_TAG_ARG,
    }
    /**
     * Utility function to determine if value is number 
     * @param n 
     */
    function isNumber(n: any): boolean {
        return !isNaN(n) && isFinite(n);
    }
    export interface AlphaExacutable {
        executionStream: Structure.Stream<AlphaBlock>
        jumpTable: {
            [tagName: string]: number
        };
    }
    /**
     * A data class that contains information on a single logical block of alpha
     */
    export class AlphaBlock {
        /**
        * The type of the block
        */
        blockType: BlockType;
        /**
        * The type of the action 
        */
        action: AlphaAction;
        /**
        * Value that either represents a tag, a register, or a number.
        */
        arguments: string[] | number[];
        /**
        * Name of the tag represented by the block, if blockType if TAG.
        */
        tag: string;
        /**
        * Flag that declares that the interpreter should stop after executing the block
        */
        breakpoint: boolean;
        constructor(blockType: BlockType, actionType: AlphaAction, value: string | number, breakpoint: boolean, tag?: string) {
            this.blockType = blockType;
            this.action = actionType;
            this.arguments = value;
            this.breakpoint;
            this.tag = tag;
        }

    }
    

    /**
     * A converter class that will convert raw alpha to blocks.
     */
    export class AlphaReader {
        private modules: AlphaModule[];
        private BREAKPOINT_CHAR = "*";
        private TAG_CHAR = ":";
        private ACCUMULATOR_REG = "A";
        private NEG_ACCUMULATOR_REG = "Z";
        private INPUT_REG = "I";
        private STACK_REG = "S";
        private CHAR_DELIMITER = "'";
        private ACTION_DELIMITER = ";";
        
        reader: Structure.Stream<string>
        blocks: AlphaBlock[] = [];


        constructor(raw: string) {
            var rawScript = raw.replace(/\s|#.*#/g, "");//Remove whitespace and comments
            this.reader = new Structure.Stream(rawScript.split(""));
        }

        /**
         * Process the given raw alpha code. Returns a list of blocks in order of execution, as well as a convinience jump table.
         */
        public process(): AlphaExacutable {
            var processed: AlphaExacutable = {
                executionStream: undefined,
                jumpTable: {}
            };

            while (!this.reader.atEnd()) {
                var block = this.readBlock();

                if (block.blockType == BlockType.TAG) {
                    processed.jumpTable[block.tag] = <number>block.value;//Make it easy to reference tags later
                }
                this.blocks.push(block);
            }
            processed.executionStream = new Structure.Stream<AlphaBlock>(this.blocks);
            return processed;
        }
        /**
         * Convert a section of alpha code into a block.
         */
        private readBlock(): AlphaBlock {
            var isTag = this.reader.peek() == ":";
            if (isTag) {
                this.reader.read();
                return new AlphaBlock(BlockType.TAG, ActionType.NONE, this.blocks.length, false, this.readTag()); //Special alpha block whose value is the location it was found at

            }

            var blockType = BlockType.ACTION;
            var action: ActionType = this.readAction();

            switch (action) {
                case ActionType.ACCUMULATE:
                case ActionType.ASSIGN:
                case ActionType.JMP:
                case ActionType.JMP_GREATER:
                case ActionType.JMP_LESS:
                case ActionType.JMP_ZERO:
                case ActionType.PUSH:
                    if (this.reader.peek() == this.TAG_CHAR) {
                        blockType = BlockType.ACTION_TAG_ARG; // Flag that extra tag processing will be needed to the interpreter
                    }
                    return new AlphaBlock(blockType, action, this.readValue(), this.findBreakpoint());
                case ActionType.POP:
                case ActionType.FLUSH:
                case ActionType.NOP:
                case ActionType.OUTPUT_CHAR:
                case ActionType.OUTPUT_NUMBER:
                    return new AlphaBlock(blockType, action, null, this.findBreakpoint()); //No value processing needed
                default:
                    throw "Invalid action found at " + this.reader.index;
            }
        }
        /**
         * Read to determine if there is a breakpoint. 
         */
        private findBreakpoint(): boolean {
            var next = this.reader.peek();
            if (next == this.BREAKPOINT_CHAR) {
                this.reader.read(); // Remove breakpoint character
                return true;
            }
            return false;
        }
        /**
         * Read value after argument. Will either produce a string value representing a register or tag, or a numeric value represening a char or number.
         */
        private readValue(): string | number {
            var next = this.reader.peek();
            if (isNumber(next) || next == "-") {
                return this.readNumeric();
            }
            else if (next == this.CHAR_DELIMITER) {
                return this.readCharAsNumeric();
            }
            else if (next == this.TAG_CHAR) {
                this.reader.read(); //Skip opening delimiter
                return this.readTag();
            }
            return this.readRegister();
        }
        /**
         * Read expecting a register argument. Will throw an error if an invalid register keyword is found.
         */
        private readRegister(): string {
            var register = this.reader.read();
            switch (register) {
                case this.INPUT_REG:
                case this.NEG_ACCUMULATOR_REG:
                case this.STACK_REG:
                case this.ACCUMULATOR_REG:
                    return register;
                default:
                    throw "Invalid register: " + register;
            }
        }
        /**
         * Read expecting a number.
         */
        private readNumeric(): number {
            var val = "";
            while (true) {
                var c = this.reader.read();
                if (!isNumber(c) && c != "-") {
                    this.reader.unRead();
                    break;
                }
                val += c;
            }
            var number = parseInt(val);
            return number;
        }
        /**
         * Read a character and convert it into an ascii code number.
         */
        private readCharAsNumeric(): number {
            var c = this.reader.read();
            this.reader.read(); //skip endquote
            return c.charCodeAt(0);
        }
        /**
         * Read up to, but not including, a given character delimiter.
         * @param delimiter The character to read up to.
         */
        private readToDelimiter(delimiter: string): string {
            var value: string = "";
            while (!this.reader.atEnd()) {
                var c = this.reader.read();
                if (c == delimiter) {
                    return value;
                }
                value += c;
            }
            throw "Could not find " + delimiter;
        }
        /**
         * Read a tag argument.
         */
        private readTag(): string {
            return this.readToDelimiter(":");
        }


        /**
         * Read untill a non-action character is found. Throws an error if action is not valid.
         */
        private readAction(): ActionType {
            var actionAccumulator = "";
            var acceptableCharacters;
            var mostLikely = "";
            do {
                var c = this.reader.read();
                if (this.terminationCharacter(c)) {
                    this.reader.unRead();
                    break;
                }
                actionAccumulator += c;

                //Find which characters would be in a valid command.
                acceptableCharacters = this.acceptableCharacters(actionAccumulator); 

                var action = this.toAction(actionAccumulator);

                //A valid action has been found, but it may be a part of a larger string.
                if (action != null) 
                {
                    // Store what the action most likely is.
                    mostLikely = actionAccumulator; 
                }

                //The next character will not create a valid action
                if (!this.isAcceptable(this.reader.peek(), acceptableCharacters)) { 

                    //Assume that the user meant whatever the last valid action was. 
                    this.unReadAmount(Math.abs(actionAccumulator.length - mostLikely.length));
                    break;
                }
               
            } while (!this.reader.atEnd());
            var actualAction = this.toAction(mostLikely);
            if (actualAction == null) {
                var invalid = mostLikely == "" ? actionAccumulator : mostLikely; //Try to give a helpful error message.
                throw "Invalid action " + invalid;

            }
            return actualAction;
        }
        private unReadAmount(amount: number):void {
            for (var i = 0; i < amount; i++) {
                this.reader.unRead();
            }
        }
        /**
         * Returns if character cannot be in an action string.
         * @param c The character
         */
        private terminationCharacter(c: string): boolean {
            
            var standardTerminator =
                c == this.ACCUMULATOR_REG ||
                c == this.BREAKPOINT_CHAR ||
                c == this.INPUT_REG ||
                c == this.NEG_ACCUMULATOR_REG ||
                c == this.STACK_REG ||
                c == this.TAG_CHAR ||
                c == this.CHAR_DELIMITER || 
                c == "-" ||
                c == this.ACTION_DELIMITER || 
                isNumber(c);

            return standardTerminator;
        }
   
        private acceptableCharacters(stringAction: string): string[] {
            var chars: string[] = [];
            for (var key in AlphaReader.associationTable) {
                if (stringAction == key) {
                    continue;
                }
                if (key.search(stringAction) == 0) { //Action starts at beginning of string
                    chars.push(key[stringAction.length]);
                }
            }
            return chars;
        }
        private isAcceptable(c: string, acceptableCharacters: string[]): boolean {
            for (var acceptable of acceptableCharacters)
            {
                if (c == acceptable) {
                    return true;
                }
            }
            return false;
        }
       
        private toAction(stringAction: string): ActionType {
            if (stringAction in AlphaReader.associationTable) {
                return AlphaReader.associationTable[stringAction]; 
            }
            return null;

        }

        
    }
}