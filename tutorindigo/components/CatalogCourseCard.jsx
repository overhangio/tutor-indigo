
const getFullImageUrl = (path) => {
  if (!path) {
    return '';
  }
  return path.startsWith('http') ? path : `${getConfig().LMS_BASE_URL}${path}`;
};

const DATE_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' };

const courseCardMessages = defineMessages({
  startDate: {
    id: 'generic.course-card.start-date',
    defaultMessage: 'Starts: {startDate}',
    description: 'Start date of the course shown in the course card footer.',
  },
  learnMore: {
    id: 'indigo.course-card.learn-more',
    defaultMessage: 'Learn More',
    description: 'Visible label of the button that opens the course about page.',
  },
  learnMoreAbout: {
    id: 'indigo.course-card.learn-more.sr-suffix',
    defaultMessage: 'about {courseName}',
    description: 'Screen-reader-only text appended to "Learn More" so the link purpose is clear out of context.',
  },
  courseNumber: {
    id: 'indigo.course-card.course-number.sr-label',
    defaultMessage: 'Course number:',
    description: 'Screen-reader-only label before the course number.',
  },
  loading: {
    id: 'indigo.course-card.loading',
    defaultMessage: 'Loading course',
    description: 'Accessible name of a course card while its data is loading.',
  },
  organization: {
    id: 'indigo.course-card.organization.sr-label',
    defaultMessage: 'Organization:',
    description: 'Screen-reader-only label before the course organization.',
  },
});

const toIsoDate = (dateString) => {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

// React 18 has useId; legacy MFEs on React 17 fall back to a per-instance random id.
const useCourseCardId = React.useId || (() => {
  const ref = useRef(null);
  if (ref.current === null) {
    ref.current = `-${Math.random().toString(36).slice(2, 10)}`;
  }
  return ref.current;
});

// The course about page is /catalog/courses/<id>/about in both catalogs, but the legacy
// catalog MFE's router already has a "/catalog" basename while the frontend-base site's
// router has none (the catalog app mounts its routes under /catalog). useHref('/') returns
// the router basename, so it tells the two apart.
const useCourseAboutPath = (courseId) => {
  const routerBase = ReactRouterDom.useHref ? ReactRouterDom.useHref('/') : '/';
  if (!courseId) {
    return undefined;
  }
  const aboutPath = `/courses/${courseId}/about`;
  return /\/catalog\/?$/.test(routerBase) ? aboutPath : `/catalog${aboutPath}`;
};

const CourseCard = ({
  isLoading,
  courseId,
  courseOrg,
  courseName,
  courseNumber,
  courseImageUrl,
  courseStartDate,
  courseAdvertisedStart,
  headingLevel = 2,
}) => {
  const intl = useIntl();
  const isExtraSmall = useMediaQuery({ maxWidth: breakpoints.small.maxWidth });
  const noCourseImg = `${getConfig().LMS_BASE_URL}/theming/asset/images/no_course_image.png`;

  // 1.3.1 Info and Relationships / 2.4.6 Headings: the course name is a real heading.
  const level = Math.min(Math.max(Number(headingLevel) || 2, 2), 6);
  const HeadingTag = `h${level}`;
  // 4.1.1 Parsing: ids must be unique even when several cards (or skeletons) are on the page.
  const uid = useCourseCardId();
  const courseAboutPath = useCourseAboutPath(courseId);
  const titleId = `course-card-title${uid}`;
  const numberId = `course-card-number${uid}`;
  const showContent = !isLoading;

  // 1.3.1: machine-readable date; an advertised start is free text ("Spring 2026"), so no <time>.
  let startDateNode = null;
  if (courseAdvertisedStart) {
    startDateNode = courseAdvertisedStart;
  } else if (courseStartDate) {
    const iso = toIsoDate(courseStartDate);
    if (iso) {
      startDateNode = (
        <time dateTime={iso}>
          {intl.formatDate(new Date(courseStartDate), DATE_FORMAT_OPTIONS)}
        </time>
      );
    }
  }

  return (
    <Card
      // 4.1.2 Name, Role, Value: each card is a named article ("CS101 Introduction to CS").
      role="article"
      aria-labelledby={showContent ? [courseNumber && numberId, titleId].filter(Boolean).join(' ') : undefined}
      aria-label={showContent ? undefined : intl.formatMessage(courseCardMessages.loading)}
      aria-busy={isLoading ? true : undefined}
      className={`course-card indigo-course-card d-flex ${isExtraSmall ? 'w-100' : 'course-card-desktop'}`}
      isLoading={isLoading}
      data-testid="course-card"
    >
      {/* 1.1.1 Non-text Content: the image only repeats the course name, so it is decorative. */}
      <Card.ImageCap
        src={getFullImageUrl(courseImageUrl)}
        fallbackSrc={noCourseImg}
        srcAlt=""
        skeletonDuringImageLoad
      />
      {showContent && courseNumber && (
        <div id={numberId} className="course-card-number px-4 pt-3 text-left">
          <span className="sr-only">{intl.formatMessage(courseCardMessages.courseNumber)} </span>
          {courseNumber}
        </div>
      )}
      <Card.Header
        title={showContent ? (
          <HeadingTag id={titleId} className="course-card-heading">
            {courseName}
          </HeadingTag>
        ) : null}
        subtitle={showContent && courseOrg ? (
          <div className="course-card-org">
            <span className="sr-only">{intl.formatMessage(courseCardMessages.organization)} </span>
            {courseOrg}
          </div>
        ) : null}
        size="sm"
      />
      <Card.Section />
      {/* 2.1.1 Keyboard: one focusable control per card, no nested interactive elements.
          2.4.4 Link Purpose + 2.5.3 Label in Name: the accessible name starts with the visible
          text ("Learn More") and the sr-only suffix names the course. */}
      {showContent && courseId && (
        <Button
          as={Link}
          to={courseAboutPath}
          variant="primary"
          className="course-card-cta mx-4 mb-4"
        >
          {intl.formatMessage(courseCardMessages.learnMore)}
          <span className="sr-only"> {intl.formatMessage(courseCardMessages.learnMoreAbout, { courseName })}</span>
        </Button>
      )}
      {showContent && startDateNode && (
        <Card.Footer className="course-card-footer justify-content-start py-3">
          {/* Decorative icon: the text next to it carries the meaning. */}
          <Icon className="mr-2 flex-shrink-0" src={Calendar} hidden />
          <span>{intl.formatMessage(courseCardMessages.startDate, { startDate: startDateNode })}</span>
        </Card.Footer>
      )}
    </Card>
  );
};
