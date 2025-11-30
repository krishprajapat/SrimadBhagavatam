import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import {Colors} from '../constants/colors';
import {Space} from '../constants/spacing';
import {rMS, rS, rV} from './responsive';
import Feather from 'react-native-vector-icons/Feather';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmColor = '#FF6B6B', // Soft red for delete
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.dialogContainer}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={styles.dialog}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Feather name="trash-2" size={rMS(28)} color={confirmColor} />
                </View>
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  activeOpacity={0.7}>
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    {backgroundColor: confirmColor},
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}>
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.lg,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: Space.xl,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconContainer: {
    marginBottom: Space.md,
  },
  iconCircle: {
    width: rS(64),
    height: rV(64),
    borderRadius: rS(32),
    backgroundColor: '#FFF5F5', // Light red background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFE5E5',
  },
  title: {
    fontSize: rMS(22),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Space.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: rMS(15),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: rMS(22),
    marginBottom: Space.xl,
    paddingHorizontal: Space.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: Space.md,
  },
  button: {
    flex: 1,
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: rV(48),
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  cancelButtonText: {
    fontSize: rMS(16),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  confirmButton: {
    shadowColor: '#FF6B6B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: rMS(16),
    fontWeight: '600',
    color: Colors.textOnDark,
  },
});

export default ConfirmDialog;
