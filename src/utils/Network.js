import axios from "axios"
import isDebug from "./Debug"
import {usePermissionDeniedCounter, useTokenExpiry} from "./Global"
import Hash from "./Hash";
import {StorageKey} from "./Storage.js";

export default class Net {
    static init() {
        axios.defaults.baseURL = this.baseUrl()
    }

    static timestampToSalt() {
        return `${Math.floor(Date.now() / 1000 / 10)}`
    }

    static saltForLogin(passwordSha256Sha256, number) {
        return "114514"; // TODO
        return Hash.sha256(
            passwordSha256Sha256
            + this.timestampToSalt()
            + `${number}`
        )
    }

    static baseUrl() {
        return isDebug()
            ? 'http://localhost:2479'
            : 'https://airx.eggtartc.com'
    }

    /**
     * Make a request to the server.
     * @param method
     * @param url
     * @param data
     * @param auth boolean, whether to use token
     * @returns {Promise<Result> | Promise<any>}
     */
    static requestProxy(method, url, data, auth) {
        const map = {
            'get': axios.get,
            'post': axios.post,
            'put': axios.put,
            'delete': axios.delete,
        }

        const errorHandlers = {
            200: () => {
                console.log(`${method.toUpperCase()} ${url} (${data}) success`)
            },
            401: () => {
                const expiry = useTokenExpiry()
                expiry.value = true
                localStorage.removeItem(StorageKey.token)
                console.log(`Token expired, redirecting to login page`)
            },
            403: () => {
                const permissionDenied = usePermissionDeniedCounter()
                permissionDenied.value += 1
                console.log(`Permission denied`)
            },
        }

        let headers = {}
        let token = localStorage.getItem('token')
        let future
        if (auth && token) {
            headers['Authorization'] = 'Bearer ' + token
        }

        if (['get', 'delete'].includes(method.toLowerCase())) {
            future = map[method.toLowerCase()](url, {
                headers: headers,
            })
        }
        else {
            future = map[method.toLowerCase()](url, data, {
                headers: headers,
            })
        }

        return future.catch(error => {
            const handler = errorHandlers[error.response.status]
            handler && handler()
        })
    }

    static get(url, data, auth) {
        let request_string = ""
        for (let key in data) {
            request_string += `${key}=${data[key]}&`
        }
        request_string = request_string.substring(
            0, request_string.length - 1)

        // let salt = sha256(this.saltFactor() + request_string)
        // request_string += `&salt=${salt}`

        console.log(`GET ${url}?${request_string}`)
        return this.requestProxy('get', `${url}?${request_string}`, null, auth)
    }

    static async post(url, data, auth) {
        console.log(`POST ${url} (${data})`)
        return await this.requestProxy('post', url, data, auth)
    }

    static async put(url, data, auth) {
        console.log(`PUT ${url} (${data})`)
        return await this.requestProxy('put', url, data, auth)
    }

    static async delete(url, data, auth) {
        console.log(`DELETE ${url} (${data})`)
        return await this.requestProxy('delete', url, data, auth)
    }
}
