import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/theme';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');

  // Parses inline formatting: **bold**, `code`, *italic*
  const renderFormattedText = (text: string) => {
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

    return tokens.map((part, index) => {
      if (!part) return null;

      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <Text key={index} style={styles.boldText}>
            {part.slice(2, -2)}
          </Text>
        );
      }

      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <Text key={index} style={styles.inlineCode}>
            {part.slice(1, -1)}
          </Text>
        );
      }

      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <Text key={index} style={styles.italicText}>
            {part.slice(1, -1)}
          </Text>
        );
      }

      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <View style={styles.container}>
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) {
          return <View key={idx} style={styles.emptyLine} />;
        }

        // Heading 1 (# ...)
        if (line.startsWith('# ')) {
          return (
            <Text key={idx} style={styles.h1}>
              {line.replace(/^#\s*/, '')}
            </Text>
          );
        }

        // Heading 2 (## ...)
        if (line.startsWith('## ')) {
          return (
            <Text key={idx} style={styles.h2}>
              {line.replace(/^##\s*/, '')}
            </Text>
          );
        }

        // Heading 3 (### ...)
        if (line.startsWith('### ')) {
          return (
            <Text key={idx} style={styles.h3}>
              {line.replace(/^###\s*/, '')}
            </Text>
          );
        }

        // Blockquote (> ...)
        if (line.startsWith('> ')) {
          return (
            <View key={idx} style={styles.blockquote}>
              <Text style={styles.blockquoteText}>
                {renderFormattedText(line.replace(/^>\s*/, ''))}
              </Text>
            </View>
          );
        }

        // Bullet list item (- or *)
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const itemText = line.replace(/^[-*]\s*/, '');
          return (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{renderFormattedText(itemText)}</Text>
            </View>
          );
        }

        // Numbered list item (1. 2. etc)
        const numMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.numPrefix}>{numMatch[1]}.</Text>
              <Text style={styles.bulletText}>{renderFormattedText(numMatch[2])}</Text>
            </View>
          );
        }

        // Divider (--- or ***)
        if (line === '---' || line === '***') {
          return <View key={idx} style={styles.divider} />;
        }

        // Standard paragraph
        return (
          <Text key={idx} style={styles.paragraph}>
            {renderFormattedText(line)}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  emptyLine: {
    height: 6,
  },
  h1: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
    marginBottom: 4,
  },
  h3: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 5,
    marginBottom: 3,
  },
  paragraph: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    marginRight: 8,
  },
  numPrefix: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 6,
    minWidth: 16,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  italicText: {
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    color: COLORS.primaryDark,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    backgroundColor: 'rgba(234, 88, 12, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  blockquoteText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
});
