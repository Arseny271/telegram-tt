import type { FC } from '../../lib/teact/teact';
import React, { useEffect, useLayoutEffect, useRef } from '../../lib/teact/teact';

import type { ApiChatFolder } from '../../api/types';
import type { MenuItemContextAction } from './ListItem';

import { requestForcedReflow, requestMutation } from '../../lib/fasterdom/fasterdom';
import buildClassName from '../../util/buildClassName';
import { FolderUtils } from '../../util/folders';
import { MouseButton } from '../../util/windowEnvironment';
import renderText from '../common/helpers/renderText';

import useContextMenuHandlers from '../../hooks/useContextMenuHandlers';
import { useFastClick } from '../../hooks/useFastClick';
import useLastCallback from '../../hooks/useLastCallback';

import CustomEmoji from '../common/CustomEmoji';
import Icon from '../common/icons/Icon';
import Menu from './Menu';
import MenuItem from './MenuItem';
import MenuSeparator from './MenuSeparator';

import './TabFolder.scss';

type OwnProps = {
  className?: string;
  folder: ApiChatFolder | undefined;
  isActive?: boolean;
  isBlocked?: boolean;
  badgeCount?: number;
  isBadgeActive?: boolean;
  previousActiveTab?: number;
  onClick?: (arg: number) => void;
  clickArg?: number;
  contextActions?: MenuItemContextAction[];
  contextRootElementSelector?: string;
};

const classNames = {
  active: 'TabFolder--active',
  badgeActive: 'TabFolder__badge--active',
};

const Tab: FC<OwnProps> = ({
  className,
  folder,
  isActive,
  isBlocked,
  badgeCount,
  isBadgeActive,
  previousActiveTab,
  onClick,
  clickArg,
  contextActions,
  contextRootElementSelector,
}) => {
  // eslint-disable-next-line no-null/no-null
  const tabRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Set initial active state
    if (isActive && previousActiveTab === undefined && tabRef.current) {
      tabRef.current!.classList.add(classNames.active);
    }
  }, [isActive, previousActiveTab]);

  useEffect(() => {
    if (!isActive || previousActiveTab === undefined) {
      return;
    }

    const tabEl = tabRef.current!;
    const prevTabEl = tabEl.parentElement!.children[previousActiveTab];
    if (!prevTabEl) {
      // The number of tabs in the parent component has decreased. It is necessary to add the active tab class name.
      if (isActive && !tabEl.classList.contains(classNames.active)) {
        requestMutation(() => {
          tabEl.classList.add(classNames.active);
        });
      }
      return;
    }

    requestMutation(() => {
      requestForcedReflow(() => {
        return () => {
          prevTabEl.classList.remove(classNames.active);
          tabEl.classList.add(classNames.active);
        };
      });
    });
  }, [isActive, previousActiveTab]);

  const {
    contextMenuAnchor, handleContextMenu, handleBeforeContextMenu, handleContextMenuClose,
    handleContextMenuHide, isContextMenuOpen,
  } = useContextMenuHandlers(tabRef, !contextActions);

  const { handleClick, handleMouseDown } = useFastClick((e: React.MouseEvent<HTMLDivElement>) => {
    if (contextActions && (e.button === MouseButton.Secondary || !onClick)) {
      handleBeforeContextMenu(e);
    }

    if (e.type === 'mousedown' && e.button !== MouseButton.Main) {
      return;
    }

    onClick?.(clickArg!);
  });

  const getTriggerElement = useLastCallback(() => tabRef.current);
  const getRootElement = useLastCallback(
    () => (contextRootElementSelector ? tabRef.current!.closest(contextRootElementSelector) : document.body),
  );
  const getMenuElement = useLastCallback(
    () => document.querySelector('#portals')!.querySelector('.TabFolder-context-menu .bubble'),
  );
  const getLayout = useLastCallback(() => ({ withPortal: true }));

  const folderIcon = FolderUtils.getIcon(folder);
  const customEmojiNode = folderIcon.emojiDocumentId ? (
    <CustomEmoji
      documentId={folderIcon.emojiDocumentId}
      size={36}
      isBig
      noPlay={folder?.noTitleAnimations}
    />
  ) : <Icon name={folderIcon.iconName} className="TabFolder_icon" />;

  return (
    <div
      className={buildClassName('TabFolder', onClick && 'Tab--interactive', className)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      ref={tabRef}
    >
      <div className="TabFolder_iconWrap">
        {customEmojiNode}
      </div>
      <span className="TabFolder_inner">
        {folder?.title ? renderText(FolderUtils.getTitle(folder.title)) : ''}
      </span>
      {Boolean(badgeCount) && (
        <span className={buildClassName('badge', isBadgeActive && classNames.badgeActive)}>{badgeCount}</span>
      )}
      {isBlocked && <Icon name="lock-badge" className="blocked" />}

      {contextActions && contextMenuAnchor !== undefined && (
        <Menu
          isOpen={isContextMenuOpen}
          anchor={contextMenuAnchor}
          getTriggerElement={getTriggerElement}
          getRootElement={getRootElement}
          getMenuElement={getMenuElement}
          getLayout={getLayout}
          className="TabFolder-context-menu"
          autoClose
          onClose={handleContextMenuClose}
          onCloseAnimationEnd={handleContextMenuHide}
          withPortal
        >
          {contextActions.map((action) => (
            ('isSeparator' in action) ? (
              <MenuSeparator key={action.key || 'separator'} />
            ) : (
              <MenuItem
                key={action.title}
                icon={action.icon}
                destructive={action.destructive}
                disabled={!action.handler}
                onClick={action.handler}
              >
                {action.title}
              </MenuItem>
            )
          ))}
        </Menu>
      )}
    </div>
  );
};

export default Tab;
