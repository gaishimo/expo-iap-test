import {
  connectAsync,
  finishTransactionAsync,
  getProductsAsync,
  IAPItemDetails,
  IAPQueryResponse,
  IAPResponseCode,
  InAppPurchase,
  purchaseItemAsync,
  setPurchaseListener
} from "expo-in-app-purchases"
import { StatusBar } from "expo-status-bar"
import React, { useCallback, useState } from "react"
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native"

const PRODUCT_ID = "com.gaishimo.example1.item01"

export default function App() {
  const [purchasing, setPurchasing] = useState<boolean>(false)
  const [productItem, setProductItem] = useState<IAPItemDetails | null>(null)

  const prepare = useCallback(async () => {
    try {
      await connectAsync()

      setPurchaseListener(async (result: IAPQueryResponse<InAppPurchase>) => {
        const { responseCode, results, errorCode } = result
        console.log(
          `purchaseListener responseCode: ${responseCode}, errorCode: ${errorCode}`,
        )
        switch (responseCode) {
          case IAPResponseCode.OK: {
            if (results == null || results.length === 0) {
              throw new Error("no purchase results")
            }
            const purchase = results.find(result => !result.acknowledged)
            if (purchase) {
              const isConsumable = false
              await finishTransactionAsync(purchase, isConsumable)
            }
            break
          }
          case IAPResponseCode.USER_CANCELED: {
            break
          }
          case IAPResponseCode.ERROR: {
            console.log("errored.", errorCode)
            break
          }
          case IAPResponseCode.DEFERRED: {
            console.log("deferred")
            break
          }
        }
        setPurchasing(false)
      })

      const { responseCode, results } = await getProductsAsync([PRODUCT_ID])
      if (responseCode === IAPResponseCode.OK) {
        if (results == null || results.length === 0) {
          throw new Error("no results")
        }

        console.log("results:", results)
        const item = results.find(r => r.productId === PRODUCT_ID)
        if (item == null) throw new Error("item not found.")
        setProductItem(item)
      }
    } catch (err) {
      console.log(err)
    }
  }, [])

  const doPurchase = useCallback(async () => {
    try {
      setPurchasing(true)
      await purchaseItemAsync(PRODUCT_ID)
    } catch (err) {
      console.log(err)
      setPurchasing(false)
    }
  }, [])

  return (
    <View style={styles.container} onLayout={prepare}>
      <Text>Expo IAP EXAMPLE</Text>
      <StatusBar style="auto" />
      {productItem && (
        <View style={styles.product}>
          {purchasing ? (
            <ActivityIndicator size="small" />
          ) : (
            <Button
              title={`Purchase Item (${productItem.price})`}
              onPress={doPurchase}
            />
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  product: { marginTop: 40 },
})
