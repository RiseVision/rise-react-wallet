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

const styles = (theme: Theme) => createStyles({
  root: {
    borderTopLeftRadius: 2, // Needs to match that of <Paper />
    borderTopRightRadius: 2, // Needs to match that of <Paper />
    backgroundColor: '#f6f6f6',
    display: 'flex',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  withoutClose: {
    marginRight: theme.spacing.unit * 8, // Width of the back button
  },
  withoutBack: {
    marginLeft: theme.spacing.unit * 8, // Width of the back button
  },
  backButton: {
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  closeButton: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});

interface Props extends WithStyles<typeof styles> {
  backButton?: boolean;
  onBackClick?: () => void;
  closeButton?: boolean;
  onCloseClick?: () => void;
}

const stylesDecorator = withStyles(styles, { name: 'ModalPaperHeader' });

const ModalPaperHeader = stylesDecorator(
  class extends React.Component<Props> {
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
      const { classes, backButton, closeButton, children } = this.props;
      return (
        <div className={classes.root}>
          {backButton && (
            <Button className={classes.backButton} onClick={this.handleBackClick} size="small" tabIndex={-1}>
              <ChevronLeft />
            </Button>
          )}
          <Typography
            className={classNames(
              classes.content,
              (!backButton && !!closeButton) && classes.withoutBack,
              (!!backButton && !closeButton) && classes.withoutClose,
            )}
            variant="headline"
            align="center"
          >
            {children}
          </Typography>
          {closeButton && (
            <Button className={classes.closeButton} onClick={this.handleCloseClick} size="small" tabIndex={-1}>
              <Close />
            </Button>
          )}
        </div>
      );
    }
  }
);

export default ModalPaperHeader;
