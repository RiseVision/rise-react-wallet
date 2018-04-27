import * as React from 'react';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import Close from '@material-ui/icons/Close';
import * as classNames from 'classnames';
import { withStyles, WithStyles } from 'material-ui/styles';

type ModalPaperHeaderClassKey =
  | 'root'
  | 'content'
  | 'backButton'
  | 'withoutBack'
  | 'closeButton'
  | 'withoutClose';

const stylesDecorator = withStyles<ModalPaperHeaderClassKey>(
  (theme) => {
    return {
      root: {
        borderTopLeftRadius: 2, // Needs to match that of <Paper />
        borderTopRightRadius: 2, // Needs to match that of <Paper />
        backgroundColor: '#f6f6f6',
        display: 'flex',
      },
      content: {
        flex: 1,
        paddingTop: 10,
        paddingBottom: 10,
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
    };
  },
  { name: 'ModalPaperHeader' }
);

interface Props {
  backButton?: boolean;
  onBackClick?: () => void;
  closeButton?: boolean;
  onCloseClick?: () => void;
}

type DecoratedProps = Props & WithStyles<ModalPaperHeaderClassKey>;

const ModalPaperHeader = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
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
