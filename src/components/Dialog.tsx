import Backdrop from '@material-ui/core/Backdrop';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ReactElement } from 'react';
import ModalPaper from './ModalPaper';
import ModalPaperHeader from './ModalPaperHeader';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center',
      '& p': {
        marginBottom: 0
      }
    },
    footer: {
      '& button': {
        color: 'gray'
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  title: ReactElement<HTMLElement> | null;
  onBackClick?: () => void;
  onClose?: () => void;
}

interface State {}

const stylesDecorator = withStyles(styles);

class Dialog extends React.Component<Props, State> {
  handleBackClick = () => {
    this.setState({ open: false });
    this.props.onClose!();
  }

  render() {
    const { open, title, classes, onClose } = this.props;

    let onBackClick = this.props.onBackClick;

    return (
      <ModalPaper open={open} backdrop={Backdrop} onEscapeKeyDown={onClose}>
        <ModalPaperHeader
          closeButton={Boolean(this.props.onClose)}
          onCloseClick={this.handleBackClick}
          backButton={Boolean(onBackClick)}
          onBackClick={onBackClick}
        >
          {title}
        </ModalPaperHeader>
        <div className={classes.content}>{this.props.children}</div>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(Dialog);
