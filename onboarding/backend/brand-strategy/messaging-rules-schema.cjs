'use strict';

const TONE_ENUM = Object.freeze(['authoritative', 'empathetic', 'pragmatic', 'bold', 'educational']);
const FORMALITY_ENUM = Object.freeze(['conversational', 'professional', 'executive']);
const ENERGY_ENUM = Object.freeze(['calm', 'balanced', 'high']);
const CHANNELS = Object.freeze(['site', 'email', 'social', 'sales-call']);

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0);
}

function validateEnum(value, allowed, path, errors) {
  if (!allowed.includes(value)) {
    errors.push(`${path} must be one of: ${allowed.join(', ')}`);
  }
}

function validateMessagingRules(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['messaging_rules must be an object'], resolved_channel_rules: null };
  }

  const voiceProfile = payload.voice_profile;
  if (!voiceProfile || typeof voiceProfile !== 'object' || Array.isArray(voiceProfile)) {
    errors.push('voice_profile is required');
  } else {
    validateEnum(voiceProfile.tone, TONE_ENUM, 'voice_profile.tone', errors);
    validateEnum(voiceProfile.formality, FORMALITY_ENUM, 'voice_profile.formality', errors);
    validateEnum(voiceProfile.energy, ENERGY_ENUM, 'voice_profile.energy', errors);
  }

  const channelRules = payload.channel_rules;
  if (!channelRules || typeof channelRules !== 'object' || Array.isArray(channelRules)) {
    errors.push('channel_rules is required');
  }

  const resolved = {};
  CHANNELS.forEach((channel) => {
    const rule = channelRules && typeof channelRules === 'object' ? (channelRules[channel] || {}) : {};
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      errors.push(`channel_rules.${channel} must be an object`);
      return;
    }

    const inheritedTone = rule.tone || (voiceProfile && voiceProfile.tone);
    const inheritedFormality = rule.formality || (voiceProfile && voiceProfile.formality);
    const inheritedEnergy = rule.energy || (voiceProfile && voiceProfile.energy);

    validateEnum(inheritedTone, TONE_ENUM, `channel_rules.${channel}.tone`, errors);
    validateEnum(inheritedFormality, FORMALITY_ENUM, `channel_rules.${channel}.formality`, errors);
    validateEnum(inheritedEnergy, ENERGY_ENUM, `channel_rules.${channel}.energy`, errors);

    if (rule.do !== undefined && !isStringArray(rule.do)) {
      errors.push(`channel_rules.${channel}.do must be a string array`);
    }
    if (rule.dont !== undefined && !isStringArray(rule.dont)) {
      errors.push(`channel_rules.${channel}.dont must be a string array`);
    }

    resolved[channel] = {
      tone: inheritedTone,
      formality: inheritedFormality,
      energy: inheritedEnergy,
      do: Array.isArray(rule.do) ? rule.do : [],
      dont: Array.isArray(rule.dont) ? rule.dont : [],
    };
  });

  return {
    valid: errors.length === 0,
    errors,
    resolved_channel_rules: resolved,
  };
}

module.exports = {
  CHANNELS,
  ENERGY_ENUM,
  FORMALITY_ENUM,
  TONE_ENUM,
  validateMessagingRules,
};
