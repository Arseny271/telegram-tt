import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useCallback, useRef } from '../../../../lib/teact/teact';

import type { ApiSticker } from '../../../../api/types';
import type { FolderEditDispatch, FoldersState } from '../../../../hooks/reducers/useFoldersReducer';

import { FolderUtils } from '../../../../util/folders';

import useFlag from '../../../../hooks/useFlag';

import CustomEmoji from '../../../common/CustomEmoji';
import Icon from '../../../common/icons/Icon';
import Button from '../../../ui/Button';
import FoldersIconPickerMenu from './FoldersIconPickerMenu';

type StateProps = {};

type OwnProps = {
  dispatch: FolderEditDispatch;
  state: FoldersState;
};

const SettingsFoldersIconButton: FC<OwnProps & StateProps> = ({
  dispatch,
  state,
}) => {
  const folderUi = FolderUtils.getIcon({
    ...state.folder, id: state.folderId || 0,
  });
  const customEmojiNode = folderUi.emojiDocumentId
    ? <CustomEmoji documentId={folderUi.emojiDocumentId} size={32} isBig />
    : <Icon name={folderUi.iconName} />;

  // eslint-disable-next-line no-null/no-null
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isStatusPickerOpen, openStatusPicker, closeStatusPicker] = useFlag(false);

  const handleEmojiStatusSet = useCallback((sticker: ApiSticker) => {
    if (sticker.isCustomEmoji) {
      dispatch({ type: 'setEmoticonCustom', payload: sticker });
    } else {
      dispatch({ type: 'setEmoticon', payload: sticker.emoji });
    }
  }, [dispatch]);

  const handleEmojiStatusClick = useCallback(() => {
    openStatusPicker();
  }, [openStatusPicker]);

  return (
    <div className="settings-folder-input-name-icon extra-spacing">
      <Button
        round
        ref={buttonRef}
        ripple={false}
        size="smaller"
        color="translucent"
        className="emoji-status"
        onClick={handleEmojiStatusClick}
      >
        {customEmojiNode}
      </Button>
      <FoldersIconPickerMenu
        statusButtonRef={buttonRef}
        isOpen={isStatusPickerOpen}
        onEmojiStatusSelect={handleEmojiStatusSet}
        onClose={closeStatusPicker}
      />
    </div>
  );
};

export default memo(SettingsFoldersIconButton);
