
const getFullImageUrl = (path) => {
  if (!path) {
    return '';
  }
  return `${getConfig().LMS_BASE_URL}${path}`;
};

const noCourseImg = `${getConfig().LMS_BASE_URL}/theming/asset/images/no_course_image.png`;
const DATE_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' };

const messages = {
  startDate: {
    id: 'generic.course-card.start-date',
    defaultMessage: 'Starts: {startDate}',
    description: 'Start date.',
  }
};

const formatDate = (dateString, intl) => {
  const date = new Date(dateString);
  return intl.formatDate(date, DATE_FORMAT_OPTIONS);
};

const getStartDateDisplay = (courseData, intl) => {
  if (courseData?.advertisedStart) {
    return courseData.advertisedStart;
  }

  if (courseData?.start) {
    return formatDate(courseData.start, intl);
  }

  return '';
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
}) => {
  const intl = useIntl();
  const isExtraSmall = useMediaQuery({ maxWidth: breakpoints.small.maxWidth });
  const startDateDisplay = (courseStartDate || courseAdvertisedStart) ? getStartDateDisplay({
    start: courseStartDate,
    advertisedStart: courseAdvertisedStart,
  }, intl) : null;

  return (
    <Card
      className={`course-card d-flex ${isExtraSmall ? 'w-100' : 'course-card-desktop'}`}
      isLoading={isLoading}
      data-testid="course-card"
    >
      <Card.ImageCap
        src={getFullImageUrl(courseImageUrl)}
        fallbackSrc={noCourseImg}
        srcAlt={`${courseName} ${courseNumber}`}
        skeletonDuringImageLoad
      />
      <div className="px-4 py-2 text-left x-small">{courseNumber}</div>
      <Card.Header
        title={courseName}
        subtitle={(
          <div>{courseOrg}</div>
        )}
        size="sm"
      />
      <Card.Section />
      {!isLoading && (
        <Button
          as={Link}
          to={courseId ? `/courses/${courseId}/about` : undefined}
          className="mx-4 mb-4"
        >Learn More</Button>
      )}
      <Card.Footer className="justify-content-start py-3">
        <Icon className="mr-2" src={Calendar} aria-label={intl.formatMessage(messages.startDate)} />
        {startDateDisplay && intl.formatMessage(messages.startDate, {
          startDate: startDateDisplay,
        })}
      </Card.Footer>
    </Card>
  );
};
