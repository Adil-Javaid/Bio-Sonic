import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo and content
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1d3557" />
      
      <LinearGradient
        colors={["#1d3557", "#457b9d", "#a8dadc"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        <View style={styles.content}>
          

          {/* Animated Text Content */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>BioSonic</Text>
            <Text style={styles.tagline}>Revolutionizing Respiratory Health</Text>
            <Text style={styles.description}>
              AI-powered chest sound analysis for accurate respiratory condition
              detection using advanced machine learning algorithms
            </Text>

            {/* Feature Highlights */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="pulse" size={20} color="#f1faee" />
                <Text style={styles.featureText}>Real-time Analysis</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={20} color="#f1faee" />
                <Text style={styles.featureText}>Medical Grade Accuracy</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="bluetooth" size={20} color="#f1faee" />
                <Text style={styles.featureText}>Eko Device Integration</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Animated Action Buttons */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonAnim,
              transform: [
                {
                  translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#f1faee", "#a8dadc"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="log-in-outline" size={20} color="#1d3557" />
              <Text style={styles.buttonTextPrimary}>Log In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate("SignUp")}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryButtonContent}>
              <Ionicons name="person-add-outline" size={20} color="#f1faee" />
              <Text style={styles.buttonTextSecondary}>Create Account</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
  style={[styles.button, styles.secondaryButton]}
  onPress={() => navigation.navigate("Main", { screen: "Home" })}
  activeOpacity={0.8}
>
  <View style={styles.secondaryButtonContent}>
    <Ionicons name="person-add-outline" size={20} color="#f1faee" />
    <Text style={styles.buttonTextSecondary}>Continue as Guest</Text>
  </View>
</TouchableOpacity>


        </Animated.View>

        {/* Medical Icons Decoration */}
        <View style={styles.decorativeIcons}>
          <Ionicons name="heart-outline" size={24} color="#a8dadc" style={styles.decorIcon1} />
          <Ionicons name="medical-outline" size={20} color="#a8dadc" style={styles.decorIcon2} />
          <Ionicons name="fitness-outline" size={22} color="#a8dadc" style={styles.decorIcon3} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "rgba(241, 250, 238, 0.1)",
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    left: width * 0.8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 140,
    height: 140,
    zIndex: 2,
  },
  logoGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    zIndex: 1,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#f1faee",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 20,
    fontWeight: "600",
    color: "#a8dadc",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#f1faee",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 30,
    opacity: 0.9,
  },
  featuresContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  featureText: {
    color: "#f1faee",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 40,
    paddingTop: 20,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButton: {
    overflow: "hidden",
  },
  buttonGradient: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#f1faee",
  },
  secondaryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTextPrimary: {
    color: "#1d3557",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  buttonTextSecondary: {
    color: "#f1faee",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    color: "#a8dadc",
    fontSize: 16,
    fontWeight: "500",
    marginRight: 6,
  },
  decorativeIcons: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  decorIcon1: {
    position: "absolute",
    top: height * 0.15,
    left: 30,
    opacity: 0.3,
  },
  decorIcon2: {
    position: "absolute",
    bottom: height * 0.25,
    right: 40,
    opacity: 0.3,
  },
  decorIcon3: {
    position: "absolute",
    top: height * 0.4,
    right: 20,
    opacity: 0.3,
  },
});

export default SplashScreen;