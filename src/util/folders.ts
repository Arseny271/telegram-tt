/*
 https://github.com/tdlib/td/blob/28c6f2e9c045372d50217919bf5768b7fbbe0294/td/telegram/DialogFilter.cpp#L937
*/

import type { ApiChatFolder, ApiFormattedText } from '../api/types';
import type { IconName } from '../types/icons';
import { ApiMessageEntityTypes } from '../api/types';

export type FolderEmoticonName = 'All' | 'Unread' | 'Unmuted' | 'Bots' | 'Channels' | 'Groups' | 'Private' | 'Custom' |
'Setup' | 'Cat' | 'Crown' | 'Favorite' | 'Flower' | 'Game' | 'Home' | 'Love' | 'Mask' | 'Party' | 'Sport' |
'Study' | 'Trade' | 'Travel' | 'Work' | 'Airplane' | 'Book' | 'Light' | 'Like' | 'Money' | 'Note' | 'Palette';

export type FolderEmoticonInfo = {
  name: FolderEmoticonName;
  emoticon: string;
  icon: IconName;
};

export type FolderCustomEmoji = {
  emojiDocumentId: string;
  emoticon: string;
};

export type FolderIcon = {
  emojiDocumentId?: string;
  iconName: IconName;
};

/* */

type EmoticonToName = { [key: string]: FolderEmoticonName };
type EmoticonNameToInfo = Record<FolderEmoticonName, FolderEmoticonInfo>;

const [
  EMOTICON_TO_TYPE,
  TYPE_TO_EMOTICON,
] = (function buildFolderEmojiMap() : [EmoticonToName, EmoticonNameToInfo] {
  const emojis = [
    '\\xF0\\x9F\\x92\\xAC', '\\xE2\\x9C\\x85', '\\xF0\\x9F\\x94\\x94',
    '\\xF0\\x9F\\xA4\\x96', '\\xF0\\x9F\\x93\\xA2', '\\xF0\\x9F\\x91\\xA5',
    '\\xF0\\x9F\\x91\\xA4', '\\xF0\\x9F\\x93\\x81', '\\xF0\\x9F\\x93\\x8B',
    '\\xF0\\x9F\\x90\\xB1', '\\xF0\\x9F\\x91\\x91', '\\xE2\\xAD\\x90\\xEF\\xB8\\x8F',
    '\\xF0\\x9F\\x8C\\xB9', '\\xF0\\x9F\\x8E\\xAE', '\\xF0\\x9F\\x8F\\xA0',
    '\\xE2\\x9D\\xA4\\xEF\\xB8\\x8F', '\\xF0\\x9F\\x8E\\xAD', '\\xF0\\x9F\\x8D\\xB8',
    '\\xE2\\x9A\\xBD\\xEF\\xB8\\x8F', '\\xF0\\x9F\\x8E\\x93', '\\xF0\\x9F\\x93\\x88',
    '\\xE2\\x9C\\x88\\xEF\\xB8\\x8F', '\\xF0\\x9F\\x92\\xBC', '\\xF0\\x9F\\x9B\\xAB',
    '\\xF0\\x9F\\x93\\x95', '\\xF0\\x9F\\x92\\xA1', '\\xF0\\x9F\\x91\\x8D',
    '\\xF0\\x9F\\x92\\xB0', '\\xF0\\x9F\\x8E\\xB5', '\\xF0\\x9F\\x8E\\xA8',
  ];

  const iconNames: FolderEmoticonName[] = [
    'All', 'Unread', 'Unmuted', 'Bots', 'Channels', 'Groups', 'Private', 'Custom',
    'Setup', 'Cat', 'Crown', 'Favorite', 'Flower', 'Game', 'Home', 'Love',
    'Mask', 'Party', 'Sport', 'Study', 'Trade', 'Travel', 'Work', 'Airplane',
    'Book', 'Light', 'Like', 'Money', 'Note', 'Palette',
  ];

  const decoder = new TextDecoder('utf-8');
  const map = {} as EmoticonToName;
  const map2 = {} as EmoticonNameToInfo;

  for (let i = 0; i < emojis.length; i++) {
    const emoticonEncoded = emojis[i];
    const emoticonName = iconNames[i];

    const matches = emoticonEncoded.match(/\\x([0-9A-Fa-f]{2})/g)!;
    const bytes = new Uint8Array(matches.map((hex: string) => parseInt(hex.slice(2), 16)));
    const decoded = decoder.decode(bytes);
    map[decoded] = emoticonName;
    map2[emoticonName] = {
      name: emoticonName,
      emoticon: decoded,
      icon: folderIconNameToIcon(emoticonName),
    };
  }

  return [map, map2];
}());

function find(emoticon: string): FolderEmoticonName | undefined {
  const name = EMOTICON_TO_TYPE[emoticon];
  if (name) {
    return name;
  }

  for (const key of Object.keys(EMOTICON_TO_TYPE)) {
    if (key.startsWith(emoticon) || emoticon.startsWith(key)) {
      return EMOTICON_TO_TYPE[key];
    }
  }

  return undefined;
}

function folderIconNameToIcon(name: FolderEmoticonName, defaultIcon: IconName = 'folder-folder'): IconName {
  switch (name) {
    case 'All': return 'folder-chats';
    case 'Unread': return 'folder-chat';
    case 'Bots': return 'folder-bot';
    case 'Groups': return 'folder-group';
    case 'Channels': return 'folder-channel';
    case 'Private': return 'folder-user';
    case 'Favorite': return 'folder-star';
    case 'Custom': return 'folder-folder';
  }

  return defaultIcon;
}

function folderGetIconName(folder: ApiChatFolder): FolderEmoticonName {
  if (folder.emoticon) {
    const name = find(folder.emoticon);
    if (name) {
      return name;
    }
  }

  if (folder.id === 0) {
    return 'All';
  }

  if (folder.pinnedChatIds?.length || folder.includedChatIds.length || folder.excludedChatIds.length) {
    return 'Custom';
  }

  if (folder.contacts || folder.nonContacts) {
    if (!folder.bots && !folder.groups && !folder.groups) {
      return 'Private';
    }
  } else {
    if (!folder.bots && !folder.channels) {
      if (!folder.groups) {
        // just in case
        return 'Custom';
      }
      return 'Groups';
    }
    if (!folder.bots && !folder.groups) {
      return 'Channels';
    }
    if (!folder.groups && !folder.channels) {
      return 'Bots';
    }
  }

  if (folder.excludeRead && !folder.excludeMuted) {
    return 'Unread';
  }

  if (folder.excludeMuted && !folder.excludeRead) {
    return 'Unmuted';
  }
  return 'Custom';
}

function folderGetIcon(folder: ApiChatFolder | undefined, defaultIcon: IconName = 'folder-folder') {
  if (folder === undefined) {
    return 'folder-chats';
  }
  return folderIconNameToIcon(folderGetIconName(folder), defaultIcon);
}

/* */

function getTitle(title: ApiFormattedText): string {
  const entities = title.entities;
  if (entities === undefined || entities.length === 0) {
    return title.text;
  }
  const entity = entities[0];
  if (entity.type !== ApiMessageEntityTypes.CustomEmoji || entity.offset !== 0) {
    return title.text;
  }
  return title.text.slice(entity.length).trimStart();
}

function getTitleAvailableChars(title: ApiFormattedText) {
  return 12 - [...title.text].length;
}

function getTitleCustomEmojiId(title: ApiFormattedText): FolderCustomEmoji | undefined {
  const entities = title.entities;
  if (entities === undefined) {
    return undefined;
  }

  for (const entity of entities) {
    if (entity.type !== ApiMessageEntityTypes.CustomEmoji) {
      continue;
    }

    return {
      emoticon: title.text.slice(entity.offset, entity.offset + entity.length),
      emojiDocumentId: entity.documentId,
    };
  }
  return undefined;
}

function buildTitle(title: string, emoji: FolderCustomEmoji | undefined): ApiFormattedText {
  if (emoji === undefined) {
    return { text: title };
  }

  return {
    text: `${emoji.emoticon} ${title}`,
    entities: [{
      type: ApiMessageEntityTypes.CustomEmoji,
      offset: 0,
      length: emoji.emoticon.length || 0,
      documentId: emoji.emojiDocumentId,
    }],
  };
}

function getIcon(folder?: ApiChatFolder, defaultIcon: IconName = 'folder-folder'): FolderIcon {
  return {
    iconName: folder ? folderGetIcon(folder, defaultIcon) : defaultIcon,
    emojiDocumentId: folder && getTitleCustomEmojiId(folder.title)?.emojiDocumentId,
  };
}

function getInfo(folder: FolderEmoticonName): FolderEmoticonInfo {
  return TYPE_TO_EMOTICON[folder];
}

export const FolderUtils = {
  getInfo,
  getIcon,
  getTitle,
  getTitleAvailableChars,
  getTitleCustomEmojiId,

  buildTitle,
};
