'use client';
import { useRef } from 'react';
import { useCookies } from 'react-cookie';
import Head from 'next/head';

export default function Login() {
    const formRef = useRef();
    const [cookies, setCookie] = useCookies(['access_token', 'user_name']);

    const handleSend = async (event: any) => {
        event.preventDefault();
        const formData = new FormData(formRef.current);
        const body_msg = JSON.stringify({
            user_name: formData.get('user_name'),
            password: formData.get('password'),
        });

    const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        body: body_msg,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (response.ok) {
        const jsonData = await response.json();
        setCookie('access_token', jsonData.access_token, { path: '/' });
        setCookie('user_name', jsonData.user_name, { path: '/' });
        setCookie('access_token', jsonData.access_token, { path: '/' });
        setCookie('user_name', jsonData.user_name, { path: '/' });
        console.log(cookies);
        window.location.href =`http://127.0.0.1:3000/shopping`;
    } else {
        console.error('Login request failed:', response.statusText);
        // ユーザーフレンドリーなエラーメッセージを表示したり、他の処理を行う
    }
    };

    return (
    <>
         <style jsx>{`
            .flex {
                background-image: repeating-linear-gradient(
                    90deg,
                    #ff4500,
                    #ff4500 50px,
                    #ff6347 50px,
                    #ff6347 100px
                );
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .form-container {
                background: #fff;
                padding: 20px;
            }
            `}</style>

        <div className="flex">
            <div className="form-container">
                <div className="form-content">
                    <form ref={formRef} onSubmit={handleSend}>
                        <h1 className="text-6xl font-bold mb-10 text-center">BTO商店</h1>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="user_name">
                                ユーザー名:
                            </label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="user_name" name="user_name" type="text" required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                パスワード：
                            </label>
                            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" name="password" type="password" required />
                        </div>
                        <button className="bg-orange-400 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                            SIGN IN
                        </button>
                    </form>
                </div>
            </div>
            </div>
        </>
    );
}