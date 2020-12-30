import $ from 'cash-dom';
import './../scss/base.scss';
import createAnchorScroll from './../../../widok-anchor-scroll';

const AnchorSet = createAnchorScroll({
  sections: '.section',
  bullets: '.anchor-bullet',
});

$('#scroll-next').on('click', function () {
  AnchorSet.scrollToNext();
})