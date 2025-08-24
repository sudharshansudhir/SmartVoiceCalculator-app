import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ScrollView
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  '`new NativeEventEmitter()` was called', // hides that exact warning
]);


export default function App() {
  const [recognizedText, setRecognizedText] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    requestAudioPermission();

    Voice.onSpeechResults = (e) => {
      const spokenText = e.value[0];
      setRecognizedText(spokenText);
      handleCalculation(spokenText);
    };

    Voice.onSpeechError = (e) => {
      console.log('Voice Error:', e);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startListening = async () => {
    try {
      setRecognizedText('');
      setResult('');
      await Voice.stop();
      await new Promise(res => setTimeout(res, 400));
      await Voice.start('en-US');
    } catch (e) {
      console.log('Voice Start Error:', e);
    }
  };

  const resetAll = () => {
    setRecognizedText('');
    setResult('');
  };

  const handleCalculation = (input) => {
    let expression = input.toLowerCase().trim();

    // Handle concatenated cases like "oneplus"
    expression = expression.replace(/oneplus/g, '1 plus');
    expression = expression.replace(/twoplus/g, '2 plus');

    // Replace words with symbols
    const wordsToSymbols = {
      'plus': '+',
      'add': '+',
      'minus': '-',
      'subtract': '-',
      'into': '*',
      'times': '*',
      'multiply': '*',
      'divide': '/',
      'divided by': '/',
      'mod': '%',
      'modulus': '%',
      'point': '.',
      'power': '^',
      'to the power of': '^',
      'square root of': 'sqrt',
      'square root': 'sqrt',
      '√': 'sqrt',
      'cube root of': 'cbrt',
      'cube root': 'cbrt',
      'out of': 'outof',
      'percentage': '%',
      'factorial': '!',
      'sin': 'sin',
      'cos': 'cos',
      'tan': 'tan',
      'log': 'log',
      'ln': 'ln'
    };

    for (const word in wordsToSymbols) {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      expression = expression.replace(regex, wordsToSymbols[word]);
    }

    // ✅ Handle square root symbol with number (e.g., √16 → sqrt 16)
    expression = expression.replace(/√(\d+)/g, 'sqrt $1');

    // Convert number words to digits
    const numberWords = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
      'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
      'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
      'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
      'seventy': 70, 'eighty': 80, 'ninety': 90,
      'hundred': 100, 'thousand': 1000
    };

    expression = expression.split(' ').map(word => {
      return numberWords[word] !== undefined ? numberWords[word] : word;
    }).join(' ');

    try {
      let resultValue;

      if (expression.includes('outof')) {
        const [a, b] = expression.split('outof').map(Number);
        resultValue = (a / b) * 100 + '%';
      } else if (expression.includes('sqrt')) {
        const num = parseFloat(expression.replace('sqrt', ''));
        resultValue = Math.sqrt(num);
      } else if (expression.includes('cbrt')) {
        const num = parseFloat(expression.replace('cbrt', ''));
        resultValue = Math.cbrt(num);
      } else if (expression.includes('^')) {
        const [base, exp] = expression.split('^').map(Number);
        resultValue = Math.pow(base, exp);
      } else if (expression.includes('sin')) {
        const num = parseFloat(expression.replace('sin', ''));
        resultValue = Math.sin(num * Math.PI / 180);
      } else if (expression.includes('cos')) {
        const num = parseFloat(expression.replace('cos', ''));
        resultValue = Math.cos(num * Math.PI / 180);
      } else if (expression.includes('tan')) {
        const num = parseFloat(expression.replace('tan', ''));
        resultValue = Math.tan(num * Math.PI / 180);
      } else if (expression.includes('log')) {
        const num = parseFloat(expression.replace('log', ''));
        resultValue = Math.log10(num);
      } else if (expression.includes('ln')) {
        const num = parseFloat(expression.replace('ln', ''));
        resultValue = Math.log(num);
      } else if (expression.includes('!')) {
        const num = parseInt(expression.replace('!', ''));
        resultValue = factorial(num);
      } else {
        resultValue = eval(expression);
      }

      setResult(resultValue.toString());
    } catch (error) {
      setResult('Invalid');
    }
  };

  const factorial = (n) => {
    if (n < 0) return 'Invalid';
    return n === 0 ? 1 : n * factorial(n - 1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Voice Calculator</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Input:</Text>
        <Text style={styles.value}>{recognizedText || 'Example: √16 or square root 16'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Output:</Text>
        <Text style={styles.value}>{result || '--'}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={startListening} style={[styles.button, styles.startButton]}>
          <Icon name="mic" size={30} color="#ff1744" />
          <Text style={styles.btnText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetAll} style={[styles.button, styles.resetButton]}>
          <Icon name="refresh" size={30} color="#ff1744" />
          <Text style={styles.btnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.supported}>
        <Text style={styles.supportTitle}>Supported Commands:</Text>
        <Text style={styles.commands}>
          ➤ Addition: "two plus two"{'\n'}
          ➤ Subtraction: "five minus three"{'\n'}
          ➤ Multiply: "three into four"{'\n'}
          ➤ Divide: "ten divided by two"{'\n'}
          ➤ Modulus: "ten mod three"{'\n'}
          ➤ Power: "two power three"{'\n'}
          ➤ Square root: "√16" or "square root sixteen"{'\n'}
          ➤ Cube root: "cube root eight"{'\n'}
          ➤ Percentage: "50 out of 100"{'\n'}
          ➤ Trigonometry: "sin 30", "cos 60", "tan 45"{'\n'}
          ➤ Factorial: "factorial five"{'\n'}
          ➤ Decimal: "three point five plus two point two"
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Deep black background for neon pop
  },

  // 🔥 HEADER with GOLD Glow
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#000',
    borderBottomWidth: 3,
    borderBottomColor: '#FFD700', // Gold border
    shadowColor: '#FFD700', // Neon gold glow
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 30, // Strong 3D effect on Android
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#39FF14', // Neon green
    textShadowColor: '#00FFFF', // Cyan glow around text
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },

  // 🔥 Input / Output Sections (Neon Cyan Boxes)
  section: {
    margin: 15,
    padding: 18,
    backgroundColor: '#111', // Dark box for contrast
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#00FFFF', // Neon cyan
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 25,
  },

  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF00FF', // Neon magenta
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },

  value: {
    fontSize: 22,
    marginTop: 10,
    color: '#39FF14', // Neon green text
    textShadowColor: '#00FFFF', // Cyan glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

  // 🔥 Button Row
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 25,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: '#FF00FF', // Neon magenta
    shadowColor: '#FF00FF', // Glow color
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 28, // Deep 3D effect
  },

  btnText: {
    color: '#00FFFF',
    marginLeft: 12,
    fontWeight: 'bold',
    fontSize: 18,
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },

  // 🔥 Supported Commands Box
  supported: {
    margin: 15,
    padding: 18,
    backgroundColor: '#111',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFD700', // Neon gold
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 35,
    elevation: 28,
  },

  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

  commands: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFF', // Keep text white for readability
    lineHeight: 24,
  },
});
