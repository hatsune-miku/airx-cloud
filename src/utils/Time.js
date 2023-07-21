export default class Time {
    static timeZoneOffsetInHours() {
        return -(new Date().getTimezoneOffset() / 60)
    }
}
