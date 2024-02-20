'use client';
import { useEffect, useState } from 'react';
import QrcodeReader from './QrcodeReader';
import {useCookies } from "react-cookie";
import Head from 'next/head';


export default function QrcodeReaderComponent(props) {
    const [scannedTime, setScannedTime] = useState(new Date());
    const [scannedResult, setScannedResult] = useState('');
    const [products, setProducts] = useState([]); // 商品を格納するための配列
    const [newProduct, setNewProduct] = useState({}); // 商品を格納するための配列
    const [quantity, setQuantity] = useState(''); // newProduct.quantityを管理するためのローカルステートを追加
    const [productTax, setProductTax] = useState(0.1); // 税率を格納するための配列
    const [total, setTotal] = useState(0); // 税抜き合計金額を保持するステート
    const [totalWithTax, setTotalWithTax] = useState(0); // 税込み合計金額を保持するステート
    const [userName, setUserName] = useState(''); // ユーザー名の状態を管理
    const [cookies,removeCookie] = useCookies(['access_token', 'user_name']); // クッキーから access_token と user_name を取得

    useEffect(() => {
        // クッキーからユーザー名を取得し、存在しない場合は'ゲスト'をセット
        const cookieUserName = cookies.user_name || 'ゲスト';
        setUserName(cookieUserName);
      }, [cookies.user_name]); // cookies.user_nameが変更されたときにのみ実行

    // QRコードを読み取った時の関数
    const onNewScanResult = (result: any) => {
        console.log('QRコードスキャン結果');
        console.log(result);
        setScannedTime(new Date());
        setScannedResult(result);
    };

    // QRコードから商品情報を渡す関数
    async function fetchProduct(scannedResult) {
        const encodedQrcode = encodeURIComponent(scannedResult);
        const res = await fetch(`http://127.0.0.1:5000/qrcode?qrcode=${encodedQrcode}`, { cache: "no-cache" });
        if (!res.ok) {
            throw new Error('Failed to fetch product');
        }
        return res.json();
    }

    // 商品情報を購入リストに入れる関数
    useEffect(() => {
        const fetchAndSetProduct = async () => {
            try {
                const newProduct = await fetchProduct(scannedResult);
                setNewProduct(newProduct);
                console.log(newProduct);
                setProducts(prevProducts => {
                    // 既存のproducts配列でproduct_idが一致する商品を探す
                    const existingProductIndex = prevProducts.findIndex(p => p.product_id === newProduct.product_id);
                    if (existingProductIndex !== -1) {
                        // 一致する商品があれば、quantityを更新する
                        let updatedProducts = [...prevProducts];
                        updatedProducts[existingProductIndex] = {
                            ...updatedProducts[existingProductIndex],
                            quantity: updatedProducts[existingProductIndex].quantity + 1,
                        };
                        // 既存の商品を更新し、配列の先頭に移動
                        updatedProducts = [updatedProducts[existingProductIndex], ...updatedProducts.slice(0, existingProductIndex), ...updatedProducts.slice(existingProductIndex + 1)];
                        return updatedProducts;
                    } else {
                        // 新しい商品を追加する（初期個数を設定）※新しいものが上に追加
                        return [{ ...newProduct, quantity: 1 },...prevProducts ];
                    }
                });
                setScannedResult('');
            } catch (error) {
                console.error("Failed to fetch and set product:", error);
            }
        };

        if(scannedResult) {
            fetchAndSetProduct();
        }
    }, [scannedTime, scannedResult]);

    // 合計金額の表示
    useEffect(() => {
        // 税抜き合計金額を計算
        const newTotal = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

        // 税込み合計金額を計算し、小数点第一位で四捨五入
        const newTotalWithTax = products.reduce((sum, product) =>
            sum + Math.round((product.price * product.quantity * (1 + productTax)) * 10) / 10, 0);

        setTotal(Math.round(newTotal)); // 税抜き合計金額をステートにセット
        setTotalWithTax(Math.round(newTotalWithTax)); // 税込み合計金額をステートにセット
    }, [products, newProduct.tax]); // products配列かnewProduct.taxが変わるたびに再計算


    // 商品情報をnewProductにセットする関数
    const handleSetNewProduct = (product: any) => {
        setProductTax(product.tax);
        setNewProduct(product);
        console.log(newProduct);
        // newProductが更新されたらquantityも更新する
        setQuantity(product.quantity.toString());
    };

    // 選択されている商品を削除する関数
    const handleRemoveProduct = () => {
        setProducts(prevProducts => prevProducts.filter(product => product.product_id !== newProduct.product_id));
        setNewProduct({}); // newProductを空にリセット
        console.log(newProduct);
    }

    // 選択されている商品の数量を更新する関数
    const handleQuantityChange = (event: any) => {
        setQuantity(event.target.value);
    };

    // 数量の入力が完了したときに呼ばれる関数
    const handleQuantityBlur = () => {
        const updatedQuantity = parseInt(quantity, 10);
        // 数量が有効な数値でない場合は、処理を終了
        if (isNaN(updatedQuantity) || updatedQuantity < 0) {
            console.error("Invalid quantity input");
            return;
        }
        // 商品リストを更新
        setProducts(prevProducts => {
            const productIndex = prevProducts.findIndex(p => p.product_id === newProduct.product_id);
            if (productIndex !== -1) {
                // 数量を更新して、リストの先頭に移動
                const updatedProduct = { ...prevProducts[productIndex], quantity: updatedQuantity };
                const newProductsList = [...prevProducts];
                newProductsList.splice(productIndex, 1); // 古い商品をリストから削除
                return [updatedProduct, ...newProductsList]; // 更新された商品をリストの先頭に追加
            }
            return prevProducts; // 何も変更しない
        });
        // newProductの数量も更新
        setNewProduct(prevNewProduct => ({ ...prevNewProduct, quantity: updatedQuantity }));
    };

    // newProduct.quantityをquantityステートにセットする関数
    const handleEditQuantity = () => {
        setQuantity(newProduct.quantity.toString());
    };

    // newProductが更新されたときにquantityステートも更新する
    useEffect(() => {
        if (newProduct && newProduct.quantity !== undefined) {
            setQuantity(newProduct.quantity.toString());
        }
    }, [newProduct]);

    // 日本時間に変換するための関数
    function getJSTDate() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const jstOffset = 9
         * 60 * 60000; // JSTはUTC+9時間
        return new Date(utc + jstOffset);
    }

    const handlePurchase = async () => {
        // 日本時間の現在時刻を取得
        const currentTime = getJSTDate();

        // ポップアップで合計金額を表示
        window.alert(`合計(税込): ${totalWithTax}円 (税抜: ${total}円)`);

        // TradeDBにデータを保存する
        try {
            // トレード情報を保存
            await fetchAndSetTrade(currentTime);

            // ディール詳細を保存
            await fetchAndDealDetail(currentTime);
        } catch (error) {
            console.error("An error occurred during the purchase process:", error);
        }

        // すべての状態をクリア
        setProducts([]);
        setNewProduct({});
        setQuantity('');
        setProductTax(0.1);
        setTotal(0);
        setTotalWithTax(0);
        removeCookie['access_token'];
        removeCookie['user_name'];
        setUserName('ゲスト');
    };

    // トレード情報を保存する関数
    const fetchAndSetTrade = async (buyTime: Date) => {
        // buyTimeをISO文字列に変換
        const buyTimeString = buyTime.toISOString();

        const response = await fetch('http://127.0.0.1:5000/trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: cookies.access_token,
                store_id: 1,
                staff_id: 1,
                machine_id: 1,
                total_charge: totalWithTax,
                total_charge_wo_tax: total,
                buy_time: buyTimeString,
            }),
        });
        if (!response.ok) {
            throw new Error('Trade could not be added');
        }
        const data = await response.json();
        console.log(data);
    };

    // ディール詳細を保存する関数
    const fetchAndDealDetail = async (buyTime: Date) => {
        // buyTimeをISO文字列に変換
        const buyTimeString = buyTime.toISOString();

        const response = await fetch('http://127.0.0.1:5000/deal_detail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                products: products.map(product => ({
                    product_qrcode: product.product_qrcode,
                    product_name: product.product_name,
                    price: product.price,
                    quantity: product.quantity,
                    tax_percent: productTax,
                    buy_time: buyTimeString,
                }))
            }),
        });
        if (!response.ok) {
            throw new Error('Deal Detail could not be added');
        }
        const data = await response.json();
        console.log(data);
    };

    return (
        <>
        <div className="container mx-auto p-4">
            <div className="text-center mb-4">
                <h1 className="font-bold text-2xl">ようこそ {userName}さん！</h1>
            </div>

            {/* バーコードスキャンセクション */}
            <div className="mb-8 border p-4 rounded-lg shadow">
                <h2 className="text-lg font-bold mb-4">バーコードスキャン</h2>
                <QrcodeReader onScanSuccess={onNewScanResult} onScanFailure={(error) => console.log('Qr scan error')} />
            </div>
            
            {/* スキャン情報表示セクション */}
            <div className="mb-8 border p-4 rounded-lg shadow">
                <div className="mb-8">
                    <h2 className="text-lg font-bold">スキャン情報</h2>
                        <p>スキャン日時：{scannedTime.toLocaleDateString()}</p>
                        <p>スキャン結果：{newProduct.product_id}</p>
                        <p>商品名：{newProduct.product_name}</p>
                        <p>値段：{newProduct.price}円</p>
                        <div>
                            <label>個数：</label>
                            {newProduct.quantity !== undefined ? (
                                <div className="inline-flex items-center">
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        onBlur={handleQuantityBlur}
                                        min="1"
                                        max="99"
                                        className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                        style={{ width: '60px' }}
                                    />
                                    <button onClick={handleEditQuantity} 
                                    className="ml-4 bg-blue-500 hover:bg-blue-700 text-white text-white text-sm font-bold py-1 px-2 rounded mr-2">
                                        数量変更</button>
                                </div>
                            ) : (
                                '個'
                            )}
                        </div>
                        <button onClick={handleRemoveProduct} 
                        className="bg-gray-500 hover:bg-gray-700 text-white text-white text-sm font-bold py-1 px-2 rounded mr-2">
                            カートから削除</button>
                </div>
            </div>

        {/* カート表示セクション */}
        <div className="mb-8 p-4 border rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">カート</h2>
        {products.map((product, index) => (
            // 商品ごとに上線を引き、最初の商品以外は上線をなくす
            <div key={index} className={`pt-4 ${index > 0 ? 'border-t' : ''}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold">{product.product_name}</h3>
                        <p>{`${product.price}円 x ${product.quantity}個 = ${product.price * product.quantity}円`}</p>
                    </div>
                    <button onClick={() => handleSetNewProduct(product)} className="ml-4 bg-gray-500 hover:bg-gray-700 text-white text-white text-sm font-bold py-1 px-2 rounded mr-2">
                        選択
                    </button>
                </div>
            </div>
        ))}
        </div>

            <div className="text-center">
                <h2 className="font-bold">合計: {totalWithTax} 円 （税抜: {total} 円）</h2>
                <button onClick={handlePurchase} 
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">
                    購入</button>
            </div>
        </div>
    </>
    );
}