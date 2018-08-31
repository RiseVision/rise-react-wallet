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
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';

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
  backButton?: boolean;
  onBackClick?: () => void;
  closeButton?: boolean;
  onCloseClick?: () => void;
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
  handleBackClick = () => {
    if (this.props.onBackClick) {
      this.props.onBackClick();
    }
  }

  handleCloseClick = () => {
    if (this.props.onCloseClick) {
      this.props.onCloseClick();
    }
  }

  render() {
    const {
      intl,
      classes,
      titleId,
      backButton,
      closeButton,
      children
    } = this.props;
    return (
      <div className={classes.root}>
        {backButton && (
          <Button
            className={classes.backButton}
            aria-label={intl.formatMessage(messages.backAriaLabel)}
            onClick={this.handleBackClick}
            size="small"
            tabIndex={-1}
          >
            <ChevronLeft />
          </Button>
        )}
        <Typography
          id={titleId}
          className={classNames(
            classes.content,
            !backButton && !!closeButton && classes.withoutBack,
            !!backButton && !closeButton && classes.withoutClose
          )}
          variant="headline"
          align="center"
        >
          {children}
        </Typography>
        {closeButton && (
          <Button
            className={classes.closeButton}
            aria-label={intl.formatMessage(messages.closeAriaLabel)}
            onClick={this.handleCloseClick}
            size="small"
            tabIndex={-1}
          >
            <Close />
          </Button>
        )}
      </div>
    );
  }
}

export default stylesDecorator(injectIntl(ModalPaperHeader));
