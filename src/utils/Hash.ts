import {Message, sha256} from "js-sha256";

export default class Hash {
    static sha256(str: Message): string {
        return sha256(str)
    }
}
