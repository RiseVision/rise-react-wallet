import { Omit } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import Close from '@material-ui/icons/Close';
import * as classNames from 'classnames';
import * as React from 'react';
import { ReactEventHandler } from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import Link from './Link';
import { PropsOf } from '../utils/metaTypes';

type LinkProps = Omit<PropsOf<typeof Link>, 'children'>;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      borderTopLeftRadius: 2, // Needs to match that of <Paper />
      borderTopRightRadius: 2, // Needs to match that of <Paper />
      backgroundColor: '#f6f6f6',
      display: 'flex'
    },
    content: {
      flex: 1,
      padding: 10
    },
    withoutClose: {
      marginRight: theme.spacing.unit * 8 // Width of the back button
    },
    withoutBack: {
      marginLeft: theme.spacing.unit * 8 // Width of the back button
    },
    backButton: {
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    },
    closeButton: {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    }
  });

interface Props extends WithStyles<typeof styles> {
  titleId?: string;
  onBackClick?: ReactEventHandler<{}>;
  backLinkProps?: LinkProps;
  onCloseClick?: ReactEventHandler<{}>;
  closeLinkProps?: LinkProps;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'ModalPaperHeader' });

const messages = defineMessages({
  backAriaLabel: {
    id: 'modal-paper-header.back-button-aria-label',
    description: 'Accessibility label for back button',
    defaultMessage: 'Go back'
  },
  closeAriaLabel: {
    id: 'modal-paper-header.close-button-aria-label',
    description: 'Accessibility label for close button',
    defaultMessage: 'Close dialog'
  }
});

class ModalPaperHeader extends React.Component<DecoratedProps> {
  render() {
    const {
      intl,
      classes,
      titleId,
      onBackClick,
      backLinkProps,
      onCloseClick,
      closeLinkProps,
      children
    } = this.props;

    const showBack = !!backLinkProps || !!onBackClick;
    const showClose = !!closeLinkProps || !!onCloseClick;

    return (
      <div className={classes.root}>
        {showBack && (
          <Link {...backLinkProps}>
            <Button
              className={classes.backButton}
              aria-label={intl.formatMessage(messages.backAriaLabel)}
              onClick={onBackClick}
              size="small"
              tabIndex={-1}
            >
              <ChevronLeft />
            </Button>
          </Link>
        )}
        <Typography
          id={titleId}
          className={classNames(
            classes.content,
            !showBack && showClose && classes.withoutBack,
            showBack && !showClose && classes.withoutClose
          )}
          variant="headline"
          align="center"
        >
          {children}
        </Typography>
        {showClose && (
          <Link {...closeLinkProps}>
            <Button
              className={classes.closeButton}
              aria-label={intl.formatMessage(messages.closeAriaLabel)}
              onClick={onCloseClick}
              size="small"
              tabIndex={-1}
            >
              <Close />
            </Button>
          </Link>
        )}
      </div>
    );
  }
}

export default stylesDecorator(injectIntl(ModalPaperHeader));
