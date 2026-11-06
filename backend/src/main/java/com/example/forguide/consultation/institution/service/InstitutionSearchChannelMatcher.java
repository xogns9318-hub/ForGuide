package com.example.forguide.consultation.institution.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.consultation.institution.dto.InstitutionDocument.Region;
import com.example.forguide.consultation.institution.dto.InstitutionDocument.ServiceDocument;
import com.example.forguide.consultation.institution.dto.InstitutionSearchCriteria;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class InstitutionSearchChannelMatcher {

    public Match bestMatch(ServiceDocument service, InstitutionSearchCriteria criteria) {
        if (criteria == null) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }
        if (service == null) {
            return null;
        }

        List<String> channels = switch (criteria.method()) {
            case "reservation" -> List.of("visit");
            case "" -> List.of("phone", "visit", "online");
            default -> List.of(criteria.method());
        };

        Match best = null;

        for (String channel : channels) {
            Match candidate = match(service, channel, criteria);

            // 같은 업무의 이용 방식 중 미확인 조건이 가장 적은 방식을 선택한다.
            if (candidate != null && (best == null
                    || candidate.unknown().size() < best.unknown().size())) {
                best = candidate;
            }
        }

        return best;
    }

    private Match match(
            ServiceDocument service,
            String channel,
            InstitutionSearchCriteria criteria
    ) {
        Integer available = switch (channel) {
            case "phone" -> service.phone() == null ? null : service.phone().available();
            case "visit" -> service.visit() == null ? null : service.visit().available();
            case "online" -> service.online() == null ? null : service.online().available();
            default -> throw new ApiException(ErrorCode.INVALID_INPUT);
        };

        if (Integer.valueOf(0).equals(available)) {
            return null;
        }

        var unknown = new LinkedHashSet<String>();

        // 미확인 정보를 미운영으로 바꾸지 않고 결과에 표시할 근거로 남긴다.
        if (!Integer.valueOf(1).equals(available)) {
            unknown.add("method");
        }

        if ("reservation".equals(criteria.method())) {
            Integer reservation = service.visit() == null
                    ? null : service.visit().reservationAvailable();

            if (Integer.valueOf(0).equals(reservation)) {
                return null;
            }

            if (!Integer.valueOf(1).equals(reservation)) {
                unknown.add("method");
            }
        }

        if (!criteria.language().isEmpty()) {
            boolean supported = service.languages() != null
                    && service.languages().stream()
                    .filter(language -> language != null)
                    .anyMatch(language -> channel.equals(language.method())
                            && InstitutionSearchRules.fold(language.code()).equals(
                            InstitutionSearchRules.fold(criteria.language())));

            // 목록에 없다는 이유만으로 해당 언어를 미지원이라고 단정하지 않는다.
            if (!supported) {
                unknown.add("language");
            }
        }

        if (!criteria.province().isEmpty()) {
            // 전화의 전국 이용 조건을 방문 상담에 적용하지 않는다.
            boolean nationwide = "phone".equals(channel)
                    && service.phone() != null
                    && "unrestricted".equals(service.phone().regionStatus());

            var locations = service.regions() == null
                    ? List.<Region>of()
                    : service.regions().stream()
                    .filter(region -> region != null
                                      && channel.equals(region.method()))
                    .toList();

            if (!nationwide) {
                if (locations.isEmpty()) {
                    unknown.add("region");
                } else {
                    var provinceLocations = locations.stream()
                            .filter(region -> criteria.province().equals(region.province()))
                            .toList();

                    if (provinceLocations.isEmpty()) {
                        return null;
                    }

                    if (!criteria.district().isEmpty()
                            && provinceLocations.stream().noneMatch(region ->
                            criteria.district().equals(region.district()))) {
                        boolean districtUnknown = provinceLocations.stream()
                                .anyMatch(region -> region.district() == null
                                        || region.district().isEmpty());

                        if (!districtUnknown) {
                            return null;
                        }

                        unknown.add("region");
                    }
                }
            }
        }

        return new Match(channel, List.copyOf(unknown));
    }

    public record Match(String channel, List<String> unknown) {
        public Match {
            unknown = List.copyOf(unknown);
        }
    }
}