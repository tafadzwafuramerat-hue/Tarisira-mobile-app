
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function PaymentReturn() {
  const router = useRouter();

  useEffect(() => {
    // Returning from Paynow does not confirm payment.
    // The server must verify the payment separately.
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment received for checking</Text>

      <Text style={styles.message}>
        Thank you for using Tarisira.
        We are checking your payment status.
      </Text>

      <Text style={styles.note}>
        Your subscription will activate once Paynow confirms your payment.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 23,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
  },
  note: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
});
